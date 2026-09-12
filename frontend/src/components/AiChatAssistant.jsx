import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  Search,
  Calculator,
  Upload,
  FileCheck2,
  MapPin,
  Clock,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Bot,
  User,
  Trash2,
} from "lucide-react";
import { sendChatMessage } from "../services/api/chatApi.js";
import { AiOrb } from "./AiOrb.jsx";


/**
 * Advanced Context-Aware AI Chatbot Assistant Component
 */
export function AiChatAssistant({
  c,
  language = "en",
  profile = null,
  selectedScheme = null,
  financialPlan = null,
  documentReadiness = null,
  selectedPartner = null,
  applicationData = null,
  onFindSchemes,
  onOpenScheme,
  onOpenCalculator,
  onOpenDocuments,
  onOpenPartners,
  onTrackApplication,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [orbState, setOrbState] = useState("idle"); // "idle" | "listening" | "thinking" | "responding" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(`sess-${Date.now()}`);

  // Build current context object for backend
  const buildCurrentContext = () => {
    return {
      profile: profile
        ? {
            category: profile.category || null,
            income: profile.income ? Number(profile.income) : null,
            state: profile.location || profile.state || null,
            business_type: profile.businessType || profile.ideaCategory || null,
            project_cost: profile.project_cost ? Number(profile.project_cost) : null,
          }
        : null,
      selected_scheme: selectedScheme
        ? {
            scheme_id: selectedScheme.id || selectedScheme.scheme_id || null,
            scheme_name: selectedScheme.name || selectedScheme.scheme_name || null,
            ministry: selectedScheme.ministry || null,
            benefit: selectedScheme.benefit || selectedScheme.maxAssistance || null,
            loan_limit: selectedScheme.loan_limit || null,
            interest: selectedScheme.interest || null,
            tenure: selectedScheme.tenure || null,
          }
        : null,
      finance: financialPlan
        ? {
            requested_loan: financialPlan.loanAmount ? Number(financialPlan.loanAmount) : null,
            monthly_emi: financialPlan.monthlyEmi ? Number(financialPlan.monthlyEmi) : null,
            interest_rate: financialPlan.interestRate ? Number(financialPlan.interestRate) : null,
            tenure_years: financialPlan.tenureYears ? Number(financialPlan.tenureYears) : null,
            financial_readiness_score: financialPlan.readinessScore || null,
          }
        : null,
      documents: documentReadiness
        ? {
            required_documents: documentReadiness.mandatory_checklist || null,
            uploaded_documents: documentReadiness.uploaded_documents || null,
            missing_documents: documentReadiness.missing_mandatory_documents || null,
            completion_percentage: documentReadiness.completion_percentage || null,
            is_ready_to_submit: documentReadiness.is_ready_to_submit || false,
          }
        : null,
      partner: selectedPartner
        ? {
            partner_id: selectedPartner.partner_id || selectedPartner.id || null,
            partner_name: selectedPartner.partner_name || selectedPartner.name || null,
            partner_type: selectedPartner.type || selectedPartner.partner_type || null,
            distance_km: selectedPartner.distance_km || null,
          }
        : null,
      application: applicationData
        ? {
            application_id: applicationData.application_id || null,
            status: applicationData.status || null,
            status_label: applicationData.status_label || null,
            submitted_at: applicationData.submitted_at || null,
            partner_name: applicationData.partner_name || null,
            next_step: applicationData.next_step || null,
          }
        : null,
    };
  };

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome = {
        id: "init-welcome",
        role: "assistant",
        text:
          language === "hi"
            ? "नमस्ते! मैं **Scheme Saathi AI सहायक** हूँ। मैं आपको उपयुक्त सरकारी योजनाओं की जानकारी, EMI गणना, आवश्यक दस्तावेज़ों की जांच, नज़दीकी बैंक पार्टनर और आवेदन स्थिति समझने में मदद कर सकता हूँ।\n\nआप मुझसे कोई भी सवाल पूछ सकते हैं!"
            : "Hello! I am your **Scheme Saathi AI Assistant**. I can help you understand recommended schemes, estimate loan EMIs, check missing documents, find authorized channel partners, or track your application status.\n\nHow can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggested_actions: [
          { action_type: "find_schemes", label: "🔍 Find Schemes" },
          { action_type: "calculate_emi", label: "🧮 Calculate EMI" },
          { action_type: "upload_documents", label: "📤 Verify Documents" },
        ],
        source: "Scheme Saathi Intelligence",
      };
      setMessages([welcome]);
    }
  }, [language]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Voice speech-to-text integration
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setOrbState("idle");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Voice input is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const localeMap = { hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", mr: "mr-IN", te: "te-IN", en: "en-IN" };
      recognition.lang = localeMap[language] || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setOrbState("listening");
        setErrorMsg("");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setOrbState("idle");
        if (event.error !== "no-speech") {
          setErrorMsg("Could not recognize voice. Please try typing your question.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setOrbState("idle");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setIsListening(false);
      setOrbState("idle");
      setErrorMsg("Microphone access failed. Please enable permissions.");
    }
  };

  // Send message to backend
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setErrorMsg("");
    setInputText("");

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsTyping(true);
    setOrbState("thinking");

    try {
      const historyPayload = newHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role, content: m.text }));

      const contextPayload = buildCurrentContext();

      const response = await sendChatMessage({
        message: text,
        language: language || "en",
        context: contextPayload,
        history: historyPayload,
        sessionId: sessionIdRef.current,
      });

      const assistantMsg = {
        id: `assist-${Date.now()}`,
        role: "assistant",
        text: response.reply || "I am here to assist your scheme journey.",
        suggested_actions: response.suggested_actions || [],
        matched_schemes: response.matched_schemes || [],
        provider: "scheme_saathi_ai",
        source: response.source_attribution || "Scheme Saathi AI Engine",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setOrbState("idle");
    } catch (err) {
      console.error("Chatbot request failed:", err);
      setErrorMsg(err.message || "Could not reach Scheme Saathi AI. Please retry.");
      setOrbState("error");

      const errorReply = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: "I am having trouble reaching the AI service right now. You can try asking again or select one of the action shortcuts below.",
        isError: true,
        suggested_actions: [
          { action_type: "find_schemes", label: "🔍 Find Schemes" },
          { action_type: "calculate_emi", label: "🧮 Calculate EMI" },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle action chip click
  const handleActionClick = (action) => {
    if (!action || !action.action_type) return;

    switch (action.action_type) {
      case "find_schemes":
        setIsOpen(false);
        if (onFindSchemes) onFindSchemes();
        break;
      case "view_scheme":
        setIsOpen(false);
        if (onOpenScheme && selectedScheme) onOpenScheme(selectedScheme);
        else if (onFindSchemes) onFindSchemes();
        break;
      case "calculate_emi":
        setIsOpen(false);
        if (onOpenCalculator) onOpenCalculator();
        break;
      case "upload_documents":
      case "view_documents":
        setIsOpen(false);
        if (onOpenDocuments) onOpenDocuments();
        break;
      case "find_partner":
        setIsOpen(false);
        if (onOpenPartners) onOpenPartners();
        break;
      case "view_application":
        setIsOpen(false);
        if (onTrackApplication && applicationData) onTrackApplication(applicationData);
        else if (onFindSchemes) onFindSchemes();
        break;
      default:
        handleSendMessage(action.label || action.action_type);
        break;
    }
  };

  const quickPrompts = [
    { label: language === "hi" ? "योजना क्यों मिली?" : "Why this scheme?", prompt: language === "hi" ? "मेरे लिए यह योजना क्यों अनुशंसित की गई है?" : "Why was this scheme recommended for me?" },
    { label: language === "hi" ? "मेरी EMI कितनी होगी?" : "Calculate my EMI", prompt: language === "hi" ? "मेरी अनुमानित मासिक EMI कितनी होगी?" : "How much is my estimated monthly EMI?" },
    { label: language === "hi" ? "कौनसे दस्तावेज़ चाहिए?" : "Missing documents?", prompt: language === "hi" ? "मेरे कौन से अनिवार्य दस्तावेज़ अभी बाकी हैं?" : "What mandatory documents are currently missing?" },
    { label: language === "hi" ? "निकटतम बैंक पार्टनर" : "Nearest partner branch", prompt: language === "hi" ? "मेरे नज़दीक कौन सा अधिकृत चैनल पार्टनर है?" : "Where is the nearest authorized channel partner branch?" },
  ];

  return (
    <>
      {/* 1. Floating AI Assistant Trigger Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          className="hover-card"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 18px 8px 10px",
            borderRadius: 40,
            background: `linear-gradient(135deg, ${c.surface}, ${c.surface2})`,
            border: `1.5px solid ${c.primary}40`,
            boxShadow: "0 12px 35px rgba(8, 127, 91, 0.22)",
            color: c.text,
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          <AiOrb state={orbState ? orbState.toUpperCase() : "IDLE"} size="sm" />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: c.primary, display: "flex", alignItems: "center", gap: 5 }}>
              <span>Scheme Saathi AI</span>
            </div>
            <div style={{ fontSize: 11, color: c.muted, fontWeight: 650 }}>Ask about schemes & loans</div>
          </div>
        </button>
      )}

      {/* 2. Chatbot Drawer / Window */}
      {isOpen && (
        <div
          className="fade"
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: "min(440px, calc(100vw - 30px))",
            height: "min(640px, calc(100vh - 40px))",
            zIndex: 10000,
            borderRadius: 24,
            background: c.surface,
            border: `1.5px solid ${c.border}`,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.22)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${c.border}`,
              background: `linear-gradient(135deg, ${c.primary}12, ${c.surface2})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <AiOrb state={orbState ? orbState.toUpperCase() : "IDLE"} size="sm" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: c.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Scheme Saathi AI</span>
                </div>
                <div style={{ fontSize: 11, color: c.muted, display: "flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={12} color={c.primary} />
                  <span>Ask about schemes & loans</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                title="Clear conversation"
                onClick={() => setMessages([])}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 6,
                  borderRadius: 8,
                  color: c.muted,
                  cursor: "pointer",
                }}
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                title="Close chat"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 6,
                  borderRadius: 8,
                  color: c.muted,
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Journey Context Bar */}
          {(selectedScheme || profile?.category || financialPlan || applicationData) && (
            <div
              style={{
                padding: "6px 14px",
                background: `${c.primary}08`,
                borderBottom: `1px solid ${c.border}60`,
                fontSize: 11,
                color: c.muted,
                display: "flex",
                alignItems: "center",
                gap: 8,
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              <strong style={{ color: c.primary, flexShrink: 0 }}>Active Context:</strong>
              {selectedScheme && <span>🎯 {selectedScheme.name || selectedScheme.scheme_name}</span>}
              {profile?.category && <span>• 👤 {profile.category}</span>}
              {financialPlan && <span>• 💰 ₹{Number(financialPlan.loanAmount).toLocaleString("en-IN")}</span>}
              {applicationData?.application_id && <span>• ⏱ {applicationData.application_id}</span>}
            </div>
          )}

          {/* Message Thread */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "86%",
                      padding: "12px 16px",
                      borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isUser
                        ? `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`
                        : c.surface2,
                      color: isUser ? "#FFFFFF" : c.text,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      boxShadow: isUser ? `0 4px 14px ${c.primary}30` : "none",
                      border: isUser ? "none" : `1px solid ${c.border}`,
                    }}
                  >
                    {/* Message Body */}
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {msg.text.split("\n").map((paragraph, pIdx) => (
                        <p key={pIdx} style={{ margin: "0 0 6px 0" }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Source Attribution */}
                    {msg.source && !isUser && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop: `1px solid ${c.border}60`,
                          color: c.muted,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <ShieldCheck size={11} color={c.primary} />
                        <span>Source: {msg.source}</span>
                      </div>
                    )}
                  </div>

                  {/* Suggested Actions attached to Assistant Message */}
                  {!isUser && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {msg.suggested_actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 14,
                            fontSize: 12,
                            fontWeight: 800,
                            background: `${c.primary}12`,
                            color: c.primary,
                            border: `1px solid ${c.primary}35`,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <span style={{ fontSize: 10, color: c.muted, padding: "0 4px" }}>
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px" }}>
                <AiOrb state="thinking" size={24} colorPrimary={c.primary} colorAccent={c.accent} />
                <span style={{ fontSize: 12, color: c.muted, fontStyle: "italic" }}>
                  Scheme Saathi AI is analyzing context...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          {messages.length < 4 && !isTyping && (
            <div
              style={{
                padding: "8px 14px",
                borderTop: `1px solid ${c.border}60`,
                background: `${c.surface2}80`,
                display: "flex",
                gap: 6,
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {quickPrompts.map((qp, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => handleSendMessage(qp.prompt)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: c.surface,
                    color: c.muted,
                    border: `1px solid ${c.border}`,
                    cursor: "pointer",
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                padding: "6px 14px",
                background: `${c.danger}15`,
                color: c.danger,
                fontSize: 12,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                style={{ background: "transparent", border: "none", color: c.danger, fontWeight: 900, cursor: "pointer", fontSize: 11 }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: `1px solid ${c.border}`,
              background: c.surface,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? "Stop listening" : "Speak your question"}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: isListening ? c.accent : `${c.primary}15`,
                color: isListening ? "#FFFFFF" : c.primary,
                border: "none",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              ref={inputRef}
              type="text"
              placeholder={
                isListening
                  ? "Listening to voice..."
                  : language === "hi"
                  ? "योजना, EMI या दस्तावेज़ के बारे में पूछें..."
                  : "Ask about schemes, EMI, or documents..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              style={{
                flex: 1,
                border: `1px solid ${c.border}`,
                borderRadius: 20,
                padding: "9px 14px",
                fontSize: 13,
                background: c.surface2,
                color: c.text,
                outline: "none",
              }}
            />

            <button
              type="button"
              disabled={!inputText.trim() || isTyping}
              onClick={() => handleSendMessage()}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: !inputText.trim() || isTyping ? `${c.border}` : c.primary,
                color: "#FFFFFF",
                border: "none",
                display: "grid",
                placeItems: "center",
                cursor: !inputText.trim() || isTyping ? "not-allowed" : "pointer",
                flexShrink: 0,
                transition: "background 0.2s ease",
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
