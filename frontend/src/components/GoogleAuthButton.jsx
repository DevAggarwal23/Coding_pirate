import React, { useEffect, useRef, useState } from "react";
import { LogIn, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { getAuthConfig, loginWithGoogle } from "../services/api/authApi.js";

/**
 * GoogleAuthButton Component
 * Integrates Google Identity Services (GIS) OAuth 2.0 Web Client.
 * Manages GIS script injection, token submission, error states, and theme styling.
 */
export function GoogleAuthButton({
  c,
  language = "en",
  onSuccess,
  onAuthSuccess,
  onError,
  profileHint = null,
}) {
  const buttonContainerRef = useRef(null);
  const [authState, setAuthState] = useState("INITIAL"); // INITIAL | AUTHENTICATING | SUCCESS | ERROR
  const [errorMessage, setErrorMessage] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [isGisLoaded, setIsGisLoaded] = useState(false);

  const notifySuccess = (authData) => {
    if (onSuccess) {
      try { onSuccess(authData); } catch (e) { console.error("onSuccess error:", e); }
    }
    if (onAuthSuccess) {
      try { onAuthSuccess(authData); } catch (e) { console.error("onAuthSuccess error:", e); }
    }
  };

  const COPY = {
    en: {
      continueWithGoogle: "Continue with Google",
      signingIn: "Signing you in securely...",
      success: "Authentication successful! Redirecting...",
      sandboxNotice: "Standard OAuth 2.0 Google Sign-In",
      govVerified: "Verified Government Beneficiary Gateway",
    },
    hi: {
      continueWithGoogle: "गूगल के साथ आगे बढ़ें",
      signingIn: "सुरक्षित रूप से साइन इन किया जा रहा है...",
      success: "प्रमाणीकरण सफल! रीडायरेक्ट हो रहा है...",
      sandboxNotice: "मानक OAuth 2.0 गूगल साइन-इन",
      govVerified: "सत्यापित सरकारी लाभार्थी पोर्टल",
    },
    bn: {
      continueWithGoogle: "গুগল দিয়ে এগিয়ে যান",
      signingIn: "নিরাপদে সাইন ইন করা হচ্ছে...",
      success: "প্রমাণীকরণ সফল! পুনঃনির্দেশ করা হচ্ছে...",
      sandboxNotice: "আদর্শ OAuth 2.0 গুগল সাইন-ইন",
      govVerified: "যাচাইকৃত সরকারি পোর্টাল",
    },
    ta: {
      continueWithGoogle: "Google மூலம் தொடரவும்",
      signingIn: "பாதுகாப்பாக உள்நுழைகிறது...",
      success: "அங்கீகாரம் வெற்றிகரமாக முடிந்தது!...",
      sandboxNotice: "OAuth 2.0 Google உள்நுழைவு",
      govVerified: "சரிபார்க்கப்பட்ட அரசு போர்டல்",
    },
    mr: {
      continueWithGoogle: "Google सह पुढे जा",
      signingIn: "सुरक्षितपणे साइन इन होत आहे...",
      success: "प्रमाणीकरण यशस्वी! पुनर्निर्देशित करत आहे...",
      sandboxNotice: "मानक OAuth 2.0 Google साइन-इन",
      govVerified: "सत्यापित शासकीय पोर्टल",
    },
    te: {
      continueWithGoogle: "Google తో కొనసాగండి",
      signingIn: "సురక్షితంగా సైన్ ఇన్ అవుతోంది...",
      success: "ధృవీకరణ విజయవంతమైంది!...",
      sandboxNotice: "OAuth 2.0 Google సైన్-ఇన్",
      govVerified: "ధృవీకరించబడిన ప్రభుత్వ పోర్టల్",
    },
  };

  const t = COPY[language] || COPY.en;

  // 1. Fetch Google Client ID and dynamically load GIS SDK
  useEffect(() => {
    let isMounted = true;

    async function initGis() {
      try {
        const config = await getAuthConfig();
        if (isMounted) {
          setGoogleClientId(config.google_client_id || "");
        }

        // Check if script already on page
        if (window.google?.accounts?.id) {
          if (isMounted) setIsGisLoaded(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) setIsGisLoaded(true);
        };
        script.onerror = () => {
          console.warn("Google Identity Services script failed to load from CDN.");
        };
        document.body.appendChild(script);
      } catch (err) {
        console.warn("Failed to load Google Auth configuration:", err);
      }
    }

    initGis();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Handle Google Credential Response from GIS SDK
  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setAuthState("ERROR");
      setErrorMessage("Google authentication was cancelled or no credential returned.");
      if (onError) onError("No credential returned.");
      return;
    }

    setAuthState("AUTHENTICATING");
    setErrorMessage("");

    try {
      const authData = await loginWithGoogle(response.credential, profileHint);
      setAuthState("SUCCESS");
      setTimeout(() => {
        notifySuccess(authData);
      }, 400);
    } catch (err) {
      setAuthState("ERROR");
      const msg = err.message || "Failed to authenticate with Google. Please try again.";
      setErrorMessage(msg);
      if (onError) onError(msg);
    }
  };

  // 3. Render native Google button if Client ID & GIS SDK available
  useEffect(() => {
    if (
      isGisLoaded &&
      googleClientId &&
      window.google?.accounts?.id &&
      buttonContainerRef.current
    ) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        buttonContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          theme: c?.bg === "#0D1512" ? "filled_black" : "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
          logo_alignment: "left",
        });
      } catch (err) {
        console.warn("GIS button render error:", err);
      }
    }
  }, [isGisLoaded, googleClientId, c]);

  // 4. Fallback / Direct Action Trigger for OAuth popup
  const handleManualGoogleClick = async () => {
    setAuthState("AUTHENTICATING");
    setErrorMessage("");

    try {
      if (googleClientId && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setAuthState("ERROR");
            setErrorMessage("Google Sign-In prompt could not be displayed. Please check popup permissions or use the official Google button.");
          }
        });
      } else {
        setAuthState("ERROR");
        setErrorMessage("Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to .env.local to enable live OAuth.");
        if (onError) onError("Google Client ID not configured.");
      }
    } catch (err) {
      setAuthState("ERROR");
      setErrorMessage(err.message || "Google sign-in encountered an error.");
      if (onError) onError(err.message);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14, width: "100%", maxWidth: 360, margin: "0 auto" }}>
      {/* Error Alert */}
      {authState === "ERROR" && errorMessage && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: `${c?.danger || "#EF4444"}15`,
            border: `1px solid ${c?.danger || "#EF4444"}40`,
            color: c?.danger || "#EF4444",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Alert */}
      {authState === "SUCCESS" && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            background: `${c?.success || "#10B981"}15`,
            border: `1px solid ${c?.success || "#10B981"}40`,
            color: c?.success || "#10B981",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{t.success}</span>
        </div>
      )}

      {/* Native GIS Container */}
      <div
        ref={buttonContainerRef}
        style={{
          display: isGisLoaded && googleClientId ? "flex" : "none",
          justifyContent: "center",
          minHeight: 44,
        }}
      />

      {/* Branded Google Button */}
      {(!isGisLoaded || !googleClientId || authState === "AUTHENTICATING") && (
        <button
          type="button"
          disabled={authState === "AUTHENTICATING" || authState === "SUCCESS"}
          onClick={handleManualGoogleClick}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            width: "100%",
            padding: "14px 20px",
            borderRadius: 16,
            background: c?.surface || "#FFFFFF",
            color: c?.text || "#1E293B",
            border: `1.5px solid ${c?.border || "#E2E8F0"}`,
            fontSize: 14.5,
            fontWeight: 700,
            cursor: authState === "AUTHENTICATING" ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
          }}
        >
          {authState === "AUTHENTICATING" ? (
            <>
              <Loader2 size={20} className="spin" style={{ color: c?.primary }} />
              <span>{t.signingIn}</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{t.continueWithGoogle}</span>
            </>
          )}
        </button>
      )}

      {/* Trust & Security Tag */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: c?.muted || "#64748B",
          fontSize: 11,
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        <ShieldCheck size={14} style={{ color: c?.primary || "#087F5B" }} />
        <span>{t.govVerified}</span>
      </div>
    </div>
  );
}
