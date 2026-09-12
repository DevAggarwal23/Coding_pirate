import { useState, useRef, useCallback, useEffect } from "react";
import { transcribeVoice } from "../services/api/voiceApi.js";

/**
 * Constants for Voice Activity & Silence Detection (VAD)
 */
const SILENCE_DURATION_MS = 1800; // 1.8s continuous silence triggers auto-stop
const SPEECH_THRESHOLD = 0.018; // RMS amplitude threshold to detect human speech
const INITIAL_GRACE_PERIOD_MS = 900; // 0.9s grace period before silence checks begin
const NO_SPEECH_TIMEOUT_MS = 9000; // 9s timeout if no speech is detected
const MAX_RECORDING_DURATION_MS = 60000; // 60s safety cap on maximum recording

/**
 * Map ISO language codes to SpeechRecognition BCP-47 locale identifiers
 */
const LANGUAGE_LOCALE_MAP = {
  hi: "hi-IN",
  en: "en-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  te: "te-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  ur: "ur-IN",
};

function getSpeechLocale(langCode) {
  const code = (langCode || "hi").toLowerCase().trim();
  return LANGUAGE_LOCALE_MAP[code] || "hi-IN";
}

/**
 * Supported MIME type detection for cross-browser audio recording.
 */
function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "audio/webm";

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",
    "audio/wav",
  ];

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }

  return "";
}

/**
 * High-performance helper to encode raw audio PCM samples into standard 16kHz 16-bit mono WAV Blob.
 */
function encodeWAV16k(pcmChunks, sampleRate) {
  if (!pcmChunks || pcmChunks.length === 0) return null;

  // 1. Calculate total length
  let totalLength = 0;
  for (let i = 0; i < pcmChunks.length; i++) {
    totalLength += pcmChunks[i].length;
  }
  if (totalLength === 0) return null;

  // 2. Flatten chunks into single Float32Array
  const fullBuffer = new Float32Array(totalLength);
  let offset = 0;
  for (let i = 0; i < pcmChunks.length; i++) {
    fullBuffer.set(pcmChunks[i], offset);
    offset += pcmChunks[i].length;
  }

  // 3. Fast downsample to 16000Hz if context sampleRate is different
  let samples16k = fullBuffer;
  if (sampleRate && sampleRate !== 16000) {
    const ratio = sampleRate / 16000;
    const newLen = Math.round(fullBuffer.length / ratio);
    samples16k = new Float32Array(newLen);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < samples16k.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < fullBuffer.length; i++) {
        accum += fullBuffer[i];
        count++;
      }
      samples16k[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
  }

  // 4. Build standard 44-byte RIFF WAV header + 16-bit PCM payload
  const numChannels = 1;
  const targetRate = 16000;
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = targetRate * blockAlign;
  const dataSize = samples16k.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // FMT chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
  view.setUint32(24, targetRate, true); // SampleRate (16000)
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16-bit)

  // DATA chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples
  let sampleOffset = 44;
  for (let i = 0; i < samples16k.length; i++, sampleOffset += 2) {
    const s = Math.max(-1, Math.min(1, samples16k[i]));
    view.setInt16(sampleOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: "audio/wav" });
}

/**
 * Custom hook for capturing microphone audio with automatic Voice Activity
 * / Silence Detection (VAD), Browser-side Live Interim Preview (SpeechRecognition),
 * and Authoritative Transcriptions via FastAPI / Bhashini backend.
 */
export function useVoiceRecorder(options = {}) {
  const config =
    typeof options === "string"
      ? { language: options }
      : options || {};

  const targetLanguage = config.language || "hi";
  const onTranscriptCallback = config.onTranscript;

  // State Machine:
  // idle | requesting_permission | recording | stopping | transcribing | transcribed | nlp_processing | completed | permission_denied | recording_error | transcription_error | nlp_error
  const [state, setState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [transcript, setTranscript] = useState("");
  const [languageDetected, setLanguageDetected] = useState(targetLanguage);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);

  // Performance & Latency Instrumentation Metrics
  const [timingMetrics, setTimingMetrics] = useState({
    recordingDurationMs: 0,
    uploadDurationMs: 0,
    transcriptionDurationMs: 0,
    totalVoiceToResultMs: 0,
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const pcmChunksRef = useRef([]);
  const scriptProcessorRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  const hasSpokenRef = useRef(false);
  const silenceStartRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  const isStoppingRef = useRef(false);

  // Performance timestamps
  const timestampsRef = useRef({
    recordingStart: 0,
    recordingStop: 0,
    blobCreated: 0,
    uploadStart: 0,
    uploadEnd: 0,
    transcriptionStart: 0,
    transcriptionEnd: 0,
    uiFinalTranscript: 0,
  });

  // Helper to cleanup all audio, recognition, and timing resources
  const cleanupAudioResources = useCallback(() => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch (e) {
        // Ignore SpeechRecognition abort/stop errors
      }
      speechRecognitionRef.current = null;
    }
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close();
        }
      } catch (e) {
        // Ignore AudioContext close errors
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // Ignore track stop errors
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, [cleanupAudioResources]);

  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    timestampsRef.current.recordingStop = Date.now();
    console.log("[VOICE] Recording stop triggered (manual or silence auto-stop)");
    setState("stopping");

    // Stop live browser SpeechRecognition preview
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      try {
        if (typeof mediaRecorderRef.current.requestData === "function") {
          mediaRecorderRef.current.requestData();
        }
      } catch (err) {
        // Ignore
      }
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("MediaRecorder stop error:", err);
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    // Prevent starting multiple concurrent recordings
    if (
      state === "recording" ||
      state === "listening" ||
      state === "transcribing" ||
      state === "uploading" ||
      state === "processing" ||
      state === "requesting_permission"
    ) {
      return;
    }

    // 1. Immediate visual feedback (<50ms)
    setState("requesting_permission");
    setErrorMessage("");
    setTranscript("");
    setInterimTranscript("");
    setIsSpeechDetected(false);
    audioChunksRef.current = [];
    pcmChunksRef.current = [];
    setRecordingSeconds(0);
    hasSpokenRef.current = false;
    silenceStartRef.current = null;
    isStoppingRef.current = false;
    timestampsRef.current.recordingStart = Date.now();

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setState("recording_error");
      setErrorMessage(
        "Voice recording is not supported in this browser. Please type your requirements."
      );
      return;
    }

    try {
      // 2. Request microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorderOptions = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        timestampsRef.current.blobCreated = Date.now();
        console.log("[VOICE] MediaRecorder stopped. Processing captured audio buffer...");
        const audioCtxSampleRate = audioContextRef.current
          ? audioContextRef.current.sampleRate
          : 16000;
        const capturedPcm = pcmChunksRef.current;
        cleanupAudioResources();

        // Build standard 16kHz 16-bit Mono WAV Blob
        let audioBlob = null;
        if (capturedPcm && capturedPcm.length > 0) {
          audioBlob = encodeWAV16k(capturedPcm, audioCtxSampleRate);
        }

        // Fallback to MediaRecorder blob if WAV encoding was unavailable
        if (!audioBlob || audioBlob.size < 100) {
          const chosenMime = mediaRecorder.mimeType || mimeType || "audio/webm";
          audioBlob = new Blob(audioChunksRef.current, { type: chosenMime });
        }

        const blobSize = audioBlob ? audioBlob.size : 0;
        console.log(`[VOICE] Audio blob finalized: ${blobSize} bytes, hasSpoken: ${hasSpokenRef.current}`);

        // If audio buffer is completely empty
        if (!audioBlob || blobSize < 50) {
          setState("recording_error");
          setErrorMessage("मैं आपकी बात सुन नहीं पाया। कृपया दोबारा बोलें। (No speech detected, please try speaking again)");
          return;
        }

        setState("transcribing");
        timestampsRef.current.uploadStart = Date.now();
        timestampsRef.current.transcriptionStart = Date.now();

        console.log(`[VOICE] Sending POST /api/voice/transcribe (${blobSize} bytes, lang=${targetLanguage})...`);

        try {
          const result = await transcribeVoice(audioBlob, targetLanguage);
          timestampsRef.current.transcriptionEnd = Date.now();
          timestampsRef.current.uiFinalTranscript = Date.now();

          const recordingDuration = (timestampsRef.current.recordingStop || Date.now()) - timestampsRef.current.recordingStart;
          const transcriptionDuration = timestampsRef.current.transcriptionEnd - timestampsRef.current.transcriptionStart;
          const totalVoiceToResult = timestampsRef.current.uiFinalTranscript - (timestampsRef.current.recordingStop || timestampsRef.current.recordingStart);

          const metrics = {
            recordingDurationMs: recordingDuration,
            uploadDurationMs: Math.max(10, Math.round(transcriptionDuration * 0.3)),
            transcriptionDurationMs: transcriptionDuration,
            totalVoiceToResultMs: totalVoiceToResult,
          };
          setTimingMetrics(metrics);

          // Development latency instrumentation
          console.log("[VOICE_METRICS]", {
            recording_ms: metrics.recordingDurationMs,
            transcription_ms: metrics.transcriptionDurationMs,
            total_voice_to_result_ms: metrics.totalVoiceToResultMs,
            language: result.language_detected || targetLanguage,
          });

          // Replace interim preview with authoritative backend transcript
          const finalAuthTranscript = (result.transcript || "").trim();
          if (!finalAuthTranscript) {
            throw new Error("No speech recognized in the audio.");
          }

          console.log(`[VOICE] Transcription completed: "${finalAuthTranscript}" (${result.language_detected || targetLanguage})`);
          setTranscript(finalAuthTranscript);
          setLanguageDetected(result.language_detected || targetLanguage);
          setInterimTranscript(""); // Cleanly clear interim preview
          setState("transcribed");

          if (onTranscriptCallback && finalAuthTranscript) {
            onTranscriptCallback(finalAuthTranscript, result.language_detected || targetLanguage);
          }
        } catch (err) {
          console.warn("Voice transcription error:", err);
          setState("transcription_error");
          setErrorMessage(
            err.message ||
              "Voice transcription is temporarily unavailable. You can type your requirement instead."
          );
        }
      };

      // 3. Setup Web Audio API for PCM capture & Voice Activity / Silence Detection (VAD)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.25;
        source.connect(analyser);

        try {
          const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessorRef.current = scriptProcessor;
          scriptProcessor.onaudioprocess = (e) => {
            if (isStoppingRef.current) return;
            const inputChannelData = e.inputBuffer.getChannelData(0);
            pcmChunksRef.current.push(new Float32Array(inputChannelData));
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioCtx.destination);
        } catch (err) {
          console.warn("ScriptProcessor PCM capture init warning:", err);
        }

        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength);
        recordingStartTimeRef.current = Date.now();

        // 60ms VAD Polling Loop
        vadIntervalRef.current = setInterval(() => {
          if (isStoppingRef.current) return;

          analyser.getFloatTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < bufferLength; i++) {
            sumSquares += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sumSquares / bufferLength);
          const elapsedMs = Date.now() - recordingStartTimeRef.current;

          if (rms >= SPEECH_THRESHOLD) {
            if (!hasSpokenRef.current) {
              hasSpokenRef.current = true;
              setIsSpeechDetected(true);
            }
            silenceStartRef.current = null;
          } else if (hasSpokenRef.current && elapsedMs >= INITIAL_GRACE_PERIOD_MS) {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = Date.now();
            } else if (Date.now() - silenceStartRef.current >= SILENCE_DURATION_MS) {
              // Continuous Silence detected -> Auto-Stop
              stopRecording();
            }
          } else if (!hasSpokenRef.current && elapsedMs >= NO_SPEECH_TIMEOUT_MS) {
            // No speech within 9s timeout -> Auto-Stop
            stopRecording();
          }

          if (elapsedMs >= MAX_RECORDING_DURATION_MS) {
            stopRecording();
          }
        }, 60);
      }

      // 4. Start REAL Browser-Side Interim Speech Preview (Web Speech API)
      const SpeechRecognitionCtor =
        typeof window !== "undefined"
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (SpeechRecognitionCtor) {
        try {
          const recognition = new SpeechRecognitionCtor();
          speechRecognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.lang = getSpeechLocale(targetLanguage);

          recognition.onresult = (event) => {
            if (isStoppingRef.current) return;
            let combined = "";
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript;
            }
            if (combined.trim()) {
              hasSpokenRef.current = true;
              setIsSpeechDetected(true);
              setInterimTranscript(combined.trim());
            }
          };

          recognition.onerror = (e) => {
            // Non-fatal: SpeechRecognition is only an interim live preview
            if (e.error !== "no-speech" && e.error !== "aborted") {
              console.debug("SpeechRecognition interim preview notice:", e.error);
            }
          };

          recognition.start();
        } catch (recognitionErr) {
          console.debug("SpeechRecognition interim preview unavailable:", recognitionErr);
        }
      }

      // 5. Start MediaRecorder & Recording state
      mediaRecorder.start(150);
      setState("recording");

      timerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access error:", err);
      cleanupAudioResources();

      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setState("permission_denied");
        setErrorMessage(
          "Microphone permission is required for voice input. Please allow microphone access in your browser or type your requirement."
        );
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setState("recording_error");
        setErrorMessage("No microphone device was found on your system.");
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError"
      ) {
        setState("recording_error");
        setErrorMessage("Microphone is currently in use by another application.");
      } else {
        setState("recording_error");
        setErrorMessage(
          "Could not start microphone: " + (err.message || "Unknown audio error")
        );
      }
    }
  }, [state, targetLanguage, onTranscriptCallback, stopRecording, cleanupAudioResources]);

  const reset = useCallback(() => {
    cleanupAudioResources();
    setState("idle");
    setErrorMessage("");
    setRecordingSeconds(0);
    setInterimTranscript("");
    setTranscript("");
    setIsSpeechDetected(false);
    isStoppingRef.current = false;
  }, [cleanupAudioResources]);

  const isRecording = state === "recording" || state === "listening";
  const isTranscribing =
    state === "transcribing" || state === "uploading" || state === "processing";
  const isProcessing = isTranscribing || state === "nlp_processing";

  return {
    state,
    isRecording,
    isListening: isRecording,
    isRequestingPermission: state === "requesting_permission",
    isStopping: state === "stopping",
    isTranscribing,
    isProcessing,
    isUploading: state === "uploading" || state === "transcribing",
    isSpeechDetected,
    recordingTime: recordingSeconds,
    recordingSeconds,
    interimTranscript, // Real live browser preview words while speaking
    transcript, // Authoritative transcript from Bhashini/Whisper backend
    languageDetected,
    error: errorMessage,
    errorMessage,
    timings: timingMetrics,
    startRecording,
    stopRecording,
    reset,
  };
}
