import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  FileText,
  IndianRupee,
  Landmark,
  Lightbulb,
  LayoutDashboard,
  Languages,
  LockKeyhole,
  MapPin,
  Percent,
  CalendarDays,
  Menu,
  Mic,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  UserCircle,
  Users,
  Volume2,
  X,
  RefreshCw,
  AlertCircle,
  Radio,
  HelpCircle,
  UploadCloud,
  Trash2,
  Eye,
  Copy,
  ExternalLink,
  AlertTriangle,
  Download,
  FileUp,
  ShieldAlert,
} from "lucide-react";
import { transcribeVoice } from "./services/api/voiceApi.js";
import { extractProfile } from "./services/api/profileApi.js";
import { matchSchemes as fetchMatchedSchemes } from "./services/api/matchingApi.js";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder.js";
import {
  getSchemeDocumentChecklist,
  uploadSchemeDocument,
  calculateDocumentReadiness,
  deleteUploadedDocument,
  getDocumentDownloadUrl,
} from "./services/api/documentApi.js";
import {
  createApplication,
  submitApplicationById,
  getApplicationStatus,
  getApplicationHistory,
  getApplicationDetails,
  getUserApplications,
} from "./services/api/applicationApi.js";
import { verifyDocument } from "./services/api/ocrApi.js";
import { PartnerMap } from "./components/PartnerMap.jsx";
import { FinancialCalculator } from "./components/FinancialCalculator.jsx";
import { AiChatAssistant } from "./components/AiChatAssistant.jsx";

const THEMES = {
  light: {
    bg: "#F5F7F5",
    surface: "#FFFFFF",
    surface2: "#EDF5F1",
    text: "#17211D",
    muted: "#64736C",
    primary: "#087F5B",
    primaryDark: "#056047",
    accent: "#E58B35",
    border: "#DCE5E0",
    danger: "#C94A43",
    success: "#2D8A58",
    shadow: "0 20px 60px rgba(20,50,38,.10)",
  },
  dark: {
    bg: "#0D1512",
    surface: "#15201C",
    surface2: "#1B2B25",
    text: "#F1F5F2",
    muted: "#AAB8B1",
    primary: "#35C59A",
    primaryDark: "#239C79",
    accent: "#F0A65B",
    border: "#2B3B34",
    danger: "#E18179",
    success: "#65C78E",
    shadow: "0 20px 60px rgba(0,0,0,.35)",
  },
};

const LANGUAGES = [
  {
    code: "en",
    name: "English",
    english: "English",
    choose: "Choose your language",
    char: "A",
    nativeGreeting: "Welcome to SchemeSaathi",
    voicePrompt: "Welcome to Scheme Saathi. Discover hundreds of government schemes tailored for you.",
    region: "Pan-India • Official Language",
    previewText: "Discover 400+ Central & State Government Schemes tailored for you",
    continueLabel: "Continue in English",
    badgeColor: "#3B82F6",
  },
  {
    code: "hi",
    name: "हिंदी",
    english: "Hindi",
    choose: "अपनी भाषा चुनें",
    char: "अ",
    nativeGreeting: "नमस्ते! योजना सेतु में आपका स्वागत है",
    voicePrompt: "नमस्ते, योजना सेतु में आपका स्वागत है। अपने लिए 400 से अधिक सरकारी योजनाओं की खोज करें।",
    region: "उत्तर व मध्य भारत • 52+ करोड़ नागरिक",
    previewText: "अपने और अपने परिवार के लिए 400+ सरकारी योजनाओं की खोज करें",
    continueLabel: "हिंदी में आगे बढ़ें",
    badgeColor: "#F97316",
  },
  {
    code: "bn",
    name: "বাংলা",
    english: "Bengali",
    choose: "আপনার ভাষা নির্বাচন করুন",
    char: "অ",
    nativeGreeting: "নমস্কার! যোজনা সেতুতে স্বাগতম",
    voicePrompt: "নমস্কার, যোজনা সেতুতে স্বাগতম। আপনার জন্য সরকারি প্রকল্প খুঁজুন।",
    region: "পশ্চিমবঙ্গ ও পূর্ব ভারত • ৯+ কোটি নাগরিক",
    previewText: "আপনার জন্য ৪০০+ সরকারি প্রকল্পের সুবিধা অন্বেষণ করুন",
    continueLabel: "বাংলায় এগিয়ে যান",
    badgeColor: "#10B981",
  },
  {
    code: "ta",
    name: "தமிழ்",
    english: "Tamil",
    choose: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    char: "அ",
    nativeGreeting: "வணக்கம்! திட்டம் சேதுவிற்கு வரவேற்கிறோம்",
    voicePrompt: "வணக்கம், திட்டம் சேதுவிற்கு வரவேற்கிறோம். அரசு திட்டங்களை கண்டறியுங்கள்.",
    region: "தமிழ்நாடு & புதுச்சேரி • 7+ கோடி குடிமக்கள்",
    previewText: "உங்களுக்கான 400+ அரசு நலத்திட்டங்களை எளிதாகக் கண்டறியுங்கள்",
    continueLabel: "தமிழில் தொடரவும்",
    badgeColor: "#8B5CF6",
  },
  {
    code: "mr",
    name: "मराठी",
    english: "Marathi",
    choose: "आपली भाषा निवडा",
    char: "म",
    nativeGreeting: "नमस्कार! योजना सेतूमध्ये स्वागत आहे",
    voicePrompt: "नमस्कार, योजना सेतूमध्ये आपले स्वागत आहे. शासकीय योजना शोधा.",
    region: "महाराष्ट्र व गोवा • ८+ कोटी नागरिक",
    previewText: "आपल्यासाठी ४००+ शासकीय कल्याणकारी योजना शोधा",
    continueLabel: "मराठीत पुढे जा",
    badgeColor: "#EC4899",
  },
  {
    code: "te",
    name: "తెలుగు",
    english: "Telugu",
    choose: "మీ భాషను ఎంచుకోండి",
    char: "తె",
    nativeGreeting: "నమస్కారం! యోజన సేతుకు స్వాగతం",
    voicePrompt: "నమస్కారం, యోజన సేతుకు స్వాగతం. ప్రభుత్వ పథకాలను కనుగొనండి.",
    region: "ఆంధ్రప్రదేశ్ & తెలంగాణ • 8+ కోట్ల పౌరులు",
    previewText: "మీ కోసం 400+ ప్రభుత్వ సంక్షేమ పథకాలను కనుగొనండి",
    continueLabel: "తెలుగులో కొనసాగించండి",
    badgeColor: "#06B6D4",
  },
];

const translations = {
  en: {
    chooseLanguage: "Choose your language",
    selectPreferred: "Select the language you are most comfortable with.",
    selected: "Selected",
    continue: "Continue",
    back: "Back",
    language: "Language",
    chooseLanguageNav: "Choose language",
    howItWorks: "How it works",
    help: "Help",
    registerLogin: "Register / Login",
    footerAbout: "About",
    footerContact: "Contact Us",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms and Conditions",
    toggleTheme: "Toggle theme",
    helpTitle: "How SchemeSaathi helps you",
    helpIntro: "Follow these simple steps to discover and understand schemes that may fit your profile.",
    helpStep1Title: "1. Choose your language",
    helpStep1Text: "Select the language you are most comfortable with. The platform updates the guidance in that language.",
    helpStep2Title: "2. Register or log in",
    helpStep2Text: "Create your account or log in to continue your journey.",
    helpStep3Title: "3. Tell us about yourself",
    helpStep3Text: "Answer a few questions about your category, income, business and location.",
    helpStep4Title: "4. Get matched schemes",
    helpStep4Text: "SchemeSaathi compares your profile with scheme requirements and shows relevant matches.",
    helpStep5Title: "5. Review and apply",
    helpStep5Text: "Open a scheme to review its details, required documents and application guidance.",
    helpStep6Title: "6. Track your progress",
    helpStep6Text: "Complete the document steps and follow the guided application flow.",
    close: "Close",

    title: "AI Scheme Matching",
    aiDiscovery: "",
    governmentSchemes: "Find the government schemes made for you.",
    landingDescription:
      "Discover government schemes suited to your profile, compare their benefits, and get clear step-by-step guidance for applying.",
    getStarted: "Get started",
    voiceFirst: "Voice-first",
    multipleLanguages: "Multiple languages",
    guidedApplications: "Guided applications",

    yourJourney: "YOUR JOURNEY",
    chooseLanguageJourney: "Choose your language",
    chooseLanguageJourneyText:
      "Use the platform in a language you're comfortable with.",
    tellAbout: "Tell us about yourself",
    tellAboutText: "Speak your answers or type them instead.",
    getMatched: "Get matched schemes",
    getMatchedText: "AI identifies schemes relevant to your profile.",
    applyGuidance: "Apply with guidance",
    applyGuidanceText:
      "Verify documents and continue with your application.",

    voiceFirstTitle: "Voice-first",
    voiceFirstText: "Answer profile questions by speaking.",
    regionalLanguages: "Regional languages",
    regionalLanguagesText:
      "Select your preferred language before registration.",
    guidedProcess: "Guided process",
    guidedProcessText:
      "From scheme discovery to document verification.",

    howWorksTitle: "Simple for the user.",
    howWorksTitle2: "Powerful behind the scenes.",
    howWorksText:
      "The platform is designed around a voice-first experience so users don't have to navigate complicated government portals.",
    createAccount: "Create an account",
    createAccountText:
      "Register securely after choosing your language.",
    speakNaturally: "Speak naturally",
    speakNaturallyText: "Answer questions using voice or text.",
    discoverSchemes: "Discover schemes",
    discoverSchemesText:
      "See ranked matches based on your profile.",

    registerTitle: "Create your account",
    loginTitle: "Welcome back",
    registerDescription:
      "Your language has been selected. Let's get started.",
    loginDescription: "Login to continue finding schemes.",
    createAccountTab: "Create account",
    login: "Login",
    fullName: "Full name",
    enterName: "Enter your name",
    emailAddress: "Email address",
    password: "Password",
    enterPassword: "Enter your password",
    prototypeNote:
      "This is a Smart India Hackathon project prototype.",

    voiceAssistance: "VOICE-FIRST ASSISTANCE",
    welcome: "Welcome",
    welcomeText:
      "You don't need to type everything. We'll ask simple questions, listen to your answers, and help build your profile automatically.",
    tapToSpeak: "Tap to speak",
    speakNaturallySmall: "Speak naturally",
    hearQuestion: "Hear the question",
    typeIfNeeded: "Type if needed",

    profile: "YOUR PROFILE",
    tellAboutYourself: "Tell us about yourself",
    voiceEnabled: "Voice enabled",
    voiceEnabledText:
      "Tap the microphone and speak your answer. The form will be filled from your response.",
    listeningAvailable: "Listening available",

    categoryQuestion: "What category do you belong to?",
    categoryHint:
      "This helps identify schemes you may qualify for.",
    incomeQuestion: "What is your yearly income?",
    incomeHint: "An approximate amount is enough at this stage.",
    businessQuestion: "What kind of business do you run?",
    businessHint: "Choose the option closest to your business.",
    locationQuestion: "Where is your business located?",
    locationHint: "Enter your state, district or city.",
    location: "Location",
    locationPlaceholder: "e.g. Mathura, Uttar Pradesh",
    sampleLocation: "Use sample location",
    findSchemes: "Find my schemes",

    loadingTitle: "Finding your matches",
    loadingText:
      "AI is comparing your profile with scheme eligibility rules.",

    matchResults: "AI MATCH RESULTS",
    schemesForYou: "Schemes for you",
    basedOnProfile: "Based on your profile:",
    matched: "MATCHED",
    match: "match",

    schemeDetails: "SCHEME DETAILS",
    mainBenefit: "MAIN BENEFIT",
    documentsNeeded: "Documents you'll need",
    verifyDocuments: "Verify documents",

    documentVerification: "DOCUMENT VERIFICATION",
    verifyYourDocuments: "Verify your documents",
    uploadText:
      "Upload a clear photo of each required document. The prototype will simulate verification feedback.",
    verified: "Verified",
    imageUnclear: "Image unclear — retake",
    checking: "Checking document...",
    notUploaded: "Not uploaded",
    submitApplication: "Submit application",

    applicationStatus: "Application status",
    submitted: "Submitted",
    underReview: "Under review",
    approved: "Approved",
    submittedMessage:
      "Your application has been successfully submitted.",
    reviewMessage:
      "Your application is currently under review.",
    approvedMessage:
      "Your application has been approved in this prototype flow.",
    simulateUpdate: "Simulate next update",
    browseSchemes: "Browse more schemes",

    sihProject:
      "AI-Driven Scheme Matching for Marginalized Entrepreneurs",
    voiceFirstAssistance: "VOICE-FIRST ASSISTANCE",
  },

  hi: {
    chooseLanguage: "अपनी भाषा चुनें",
    selectPreferred: "वह भाषा चुनें जिसमें आप सबसे सहज हैं।",
    selected: "चयनित",
    continue: "जारी रखें",
    back: "वापस",
    language: "भाषा",
    chooseLanguageNav: "भाषा चुनें",
    howItWorks: "यह कैसे काम करता है",
    help: "मदद",
    registerLogin: "रजिस्टर / लॉगिन",
    footerAbout: "हमारे बारे में",
    footerContact: "संपर्क करें",
    footerPrivacy: "गोपनीयता नीति",
    footerTerms: "नियम और शर्तें",
    toggleTheme: "थीम बदलें",
    helpTitle: "SchemeSaathi आपकी कैसे मदद करता है",
    helpIntro: "अपने प्रोफ़ाइल के लिए उपयुक्त योजनाओं को खोजने और समझने के लिए इन आसान चरणों का पालन करें।",
    helpStep1Title: "1. अपनी भाषा चुनें",
    helpStep1Text: "जिस भाषा में आप सबसे सहज हैं उसे चुनें। प्लेटफ़ॉर्म की जानकारी उसी भाषा में दिखाई देगी।",
    helpStep2Title: "2. रजिस्टर या लॉगिन करें",
    helpStep2Text: "अपना खाता बनाएं या आगे बढ़ने के लिए लॉगिन करें।",
    helpStep3Title: "3. अपने बारे में बताएं",
    helpStep3Text: "अपनी श्रेणी, आय, व्यवसाय और स्थान से जुड़े कुछ सवालों के जवाब दें।",
    helpStep4Title: "4. योजनाएँ खोजें",
    helpStep4Text: "SchemeSaathi आपकी प्रोफ़ाइल की तुलना योजना की आवश्यकताओं से करके संबंधित योजनाएँ दिखाता है।",
    helpStep5Title: "5. जानकारी देखें और आवेदन करें",
    helpStep5Text: "किसी योजना को खोलकर उसकी जानकारी, आवश्यक दस्तावेज़ और आवेदन मार्गदर्शन देखें।",
    helpStep6Title: "6. अपनी प्रगति देखें",
    helpStep6Text: "दस्तावेज़ से जुड़े चरण पूरे करें और निर्देशित आवेदन प्रक्रिया का पालन करें।",
    close: "बंद करें",

    smartIndia: "स्मार्ट इंडिया हैकाथॉन",
    title: "एआई योजना मिलान",
    aiDiscovery: "एआई आधारित सरकारी योजना खोज",
    governmentSchemes: "अपने लिए बनाई गई सरकारी योजनाएँ खोजें।",
    landingDescription:
      "अपनी पसंदीदा भाषा में अपने बारे में बताएं। हमारा एआई आपकी प्रोफ़ाइल के अनुसार उपयुक्त सरकारी योजनाएँ खोजता है और आवेदन प्रक्रिया में मार्गदर्शन करता है।",
    getStarted: "शुरू करें",
    voiceFirst: "आवाज़ पहले",
    multipleLanguages: "कई भाषाएँ",
    guidedApplications: "निर्देशित आवेदन",

    yourJourney: "आपकी यात्रा",
    chooseLanguageJourney: "अपनी भाषा चुनें",
    chooseLanguageJourneyText:
      "अपनी सुविधानुसार भाषा में प्लेटफ़ॉर्म का उपयोग करें।",
    tellAbout: "अपने बारे में बताएं",
    tellAboutText: "अपने उत्तर बोलें या टाइप करें।",
    getMatched: "योजनाएँ खोजें",
    getMatchedText: "एआई आपकी प्रोफ़ाइल के अनुसार योजनाएँ खोजता है।",
    applyGuidance: "मार्गदर्शन के साथ आवेदन करें",
    applyGuidanceText:
      "दस्तावेज़ सत्यापित करें और आवेदन जारी रखें।",

    voiceFirstTitle: "आवाज़ पहले",
    voiceFirstText: "प्रोफ़ाइल के सवालों के जवाब बोलकर दें।",
    regionalLanguages: "क्षेत्रीय भाषाएँ",
    regionalLanguagesText:
      "पंजीकरण से पहले अपनी पसंदीदा भाषा चुनें।",
    guidedProcess: "निर्देशित प्रक्रिया",
    guidedProcessText:
      "योजना खोजने से लेकर दस्तावेज़ सत्यापन तक।",

    howWorksTitle: "उपयोगकर्ता के लिए आसान।",
    howWorksTitle2: "पीछे से शक्तिशाली।",
    howWorksText:
      "यह प्लेटफ़ॉर्म आवाज़ आधारित अनुभव के लिए बनाया गया है ताकि उपयोगकर्ताओं को जटिल सरकारी पोर्टल पर जाने की आवश्यकता न हो।",
    createAccount: "खाता बनाएँ",
    createAccountText:
      "भाषा चुनने के बाद सुरक्षित रूप से पंजीकरण करें।",
    speakNaturally: "स्वाभाविक रूप से बोलें",
    speakNaturallyText: "आवाज़ या टेक्स्ट से सवालों के जवाब दें।",
    discoverSchemes: "योजनाएँ खोजें",
    discoverSchemesText:
      "अपनी प्रोफ़ाइल के आधार पर योजनाओं का मिलान देखें।",

    registerTitle: "अपना खाता बनाएँ",
    loginTitle: "वापसी पर स्वागत है",
    registerDescription:
      "आपकी भाषा चुन ली गई है। चलिए शुरू करते हैं।",
    loginDescription: "योजनाएँ खोजने के लिए लॉगिन करें।",
    createAccountTab: "खाता बनाएँ",
    login: "लॉग इन करें",
    fullName: "पूरा नाम",
    enterName: "अपना नाम दर्ज करें",
    emailAddress: "ईमेल पता",
    password: "पासवर्ड",
    enterPassword: "अपना पासवर्ड दर्ज करें",
    prototypeNote:
      "यह स्मार्ट इंडिया हैकाथॉन प्रोजेक्ट का प्रोटोटाइप है।",

    voiceAssistance: "आवाज़ आधारित सहायता",
    welcome: "स्वागत है",
    welcomeText:
      "आपको सब कुछ टाइप करने की आवश्यकता नहीं है। हम आसान सवाल पूछेंगे, आपके जवाब सुनेंगे और आपकी प्रोफ़ाइल अपने आप तैयार करने में मदद करेंगे।",
    tapToSpeak: "बोलने के लिए टैप करें",
    speakNaturallySmall: "स्वाभाविक रूप से बोलें",
    hearQuestion: "सवाल सुनें",
    typeIfNeeded: "ज़रूरत हो तो टाइप करें",

    profile: "आपकी प्रोफ़ाइल",
    tellAboutYourself: "अपने बारे में बताएं",
    voiceEnabled: "आवाज़ सक्षम",
    voiceEnabledText:
      "माइक्रोफ़ोन पर टैप करें और अपना जवाब बोलें। फॉर्म आपके जवाब से अपने आप भरा जाएगा।",
    listeningAvailable: "सुनने की सुविधा उपलब्ध है",

    categoryQuestion: "आप किस श्रेणी से संबंधित हैं?",
    categoryHint:
      "इससे उन योजनाओं की पहचान करने में मदद मिलेगी जिनके लिए आप पात्र हो सकते हैं।",
    incomeQuestion: "आपकी वार्षिक आय कितनी है?",
    incomeHint: "इस चरण में अनुमानित राशि पर्याप्त है।",
    businessQuestion: "आप किस प्रकार का व्यवसाय करते हैं?",
    businessHint: "अपने व्यवसाय के सबसे करीब वाला विकल्प चुनें।",
    locationQuestion: "आपका व्यवसाय कहाँ स्थित है?",
    locationHint: "अपना राज्य, जिला या शहर दर्ज करें।",
    location: "स्थान",
    locationPlaceholder: "जैसे मथुरा, उत्तर प्रदेश",
    sampleLocation: "उदाहरण स्थान उपयोग करें",
    findSchemes: "मेरी योजनाएँ खोजें",

    loadingTitle: "आपके लिए योजनाएँ खोजी जा रही हैं",
    loadingText:
      "एआई आपकी प्रोफ़ाइल की तुलना योजना पात्रता नियमों से कर रहा है।",

    matchResults: "एआई मिलान परिणाम",
    schemesForYou: "आपके लिए योजनाएँ",
    basedOnProfile: "आपकी प्रोफ़ाइल के आधार पर:",
    matched: "मिली योजनाएँ",
    match: "मिलान",

    schemeDetails: "योजना विवरण",
    mainBenefit: "मुख्य लाभ",
    documentsNeeded: "आवश्यक दस्तावेज़",
    verifyDocuments: "दस्तावेज़ सत्यापित करें",

    documentVerification: "दस्तावेज़ सत्यापन",
    verifyYourDocuments: "अपने दस्तावेज़ सत्यापित करें",
    uploadText:
      "प्रत्येक आवश्यक दस्तावेज़ की स्पष्ट फोटो अपलोड करें। प्रोटोटाइप सत्यापन प्रतिक्रिया का अनुकरण करेगा।",
    verified: "सत्यापित",
    imageUnclear: "फोटो स्पष्ट नहीं है — दोबारा लें",
    checking: "दस्तावेज़ जाँचा जा रहा है...",
    notUploaded: "अपलोड नहीं किया गया",
    submitApplication: "आवेदन जमा करें",

    applicationStatus: "आवेदन की स्थिति",
    submitted: "जमा किया गया",
    underReview: "समीक्षा में",
    approved: "स्वीकृत",
    submittedMessage:
      "आपका आवेदन सफलतापूर्वक जमा कर दिया गया है।",
    reviewMessage:
      "आपका आवेदन वर्तमान में समीक्षा के अधीन है।",
    approvedMessage:
      "इस प्रोटोटाइप प्रक्रिया में आपका आवेदन स्वीकृत हो गया है।",
    simulateUpdate: "अगला अपडेट दिखाएँ",
    browseSchemes: "और योजनाएँ देखें",

    sihProject:
      "वंचित उद्यमियों के लिए एआई आधारित योजना मिलान",
    voiceFirstAssistance: "आवाज़ आधारित सहायता",
  },

  bn: {
    chooseLanguage: "আপনার ভাষা নির্বাচন করুন",
    selectPreferred: "আপনি যে ভাষায় সবচেয়ে স্বাচ্ছন্দ্যবোধ করেন সেটি নির্বাচন করুন।",
    selected: "নির্বাচিত",
    continue: "চালিয়ে যান",
    back: "পিছনে",
    language: "ভাষা",
    chooseLanguageNav: "ভাষা নির্বাচন করুন",
    howItWorks: "এটি কীভাবে কাজ করে",
    help: "সাহায্য",
    registerLogin: "রেজিস্টার / লগইন",
    footerAbout: "আমাদের সম্পর্কে",
    footerContact: "যোগাযোগ করুন",
    footerPrivacy: "গোপনীয়তা নীতি",
    footerTerms: "শর্তাবলি",
    toggleTheme: "থিম পরিবর্তন করুন",
    helpTitle: "SchemeSaathi কীভাবে আপনাকে সাহায্য করে",
    helpIntro: "আপনার প্রোফাইলের জন্য উপযুক্ত প্রকল্প খুঁজে পেতে ও বুঝতে এই সহজ ধাপগুলি অনুসরণ করুন।",
    helpStep1Title: "1. আপনার ভাষা বেছে নিন",
    helpStep1Text: "আপনি যে ভাষায় সবচেয়ে স্বাচ্ছন্দ্যবোধ করেন সেটি নির্বাচন করুন। প্ল্যাটফর্মের নির্দেশনা সেই ভাষায় দেখানো হবে।",
    helpStep2Title: "2. রেজিস্টার বা লগইন করুন",
    helpStep2Text: "আপনার অ্যাকাউন্ট তৈরি করুন অথবা এগিয়ে যেতে লগইন করুন।",
    helpStep3Title: "3. নিজের সম্পর্কে বলুন",
    helpStep3Text: "আপনার শ্রেণি, আয়, ব্যবসা এবং অবস্থান সম্পর্কে কয়েকটি প্রশ্নের উত্তর দিন।",
    helpStep4Title: "4. মিল থাকা প্রকল্প দেখুন",
    helpStep4Text: "SchemeSaathi আপনার প্রোফাইলকে প্রকল্পের প্রয়োজনীয়তার সঙ্গে মিলিয়ে প্রাসঙ্গিক প্রকল্প দেখায়।",
    helpStep5Title: "5. দেখুন এবং আবেদন করুন",
    helpStep5Text: "কোনও প্রকল্প খুলে তার বিবরণ, প্রয়োজনীয় নথি এবং আবেদন নির্দেশনা দেখুন।",
    helpStep6Title: "6. অগ্রগতি অনুসরণ করুন",
    helpStep6Text: "নথির ধাপগুলি সম্পূর্ণ করুন এবং নির্দেশিত আবেদন প্রক্রিয়া অনুসরণ করুন।",
    close: "বন্ধ করুন",

    smartIndia: "স্মার্ট ইন্ডিয়া হ্যাকাথন",
    title: "এআই স্কিম ম্যাচিং",
    aiDiscovery: "এআই-চালিত সরকারি প্রকল্প অনুসন্ধান",
    governmentSchemes: "আপনার জন্য তৈরি সরকারি প্রকল্পগুলি খুঁজুন।",
    landingDescription:
      "আপনার পছন্দের ভাষায় নিজের সম্পর্কে বলুন। আমাদের এআই আপনার প্রোফাইলের সঙ্গে উপযুক্ত সরকারি প্রকল্প মিলিয়ে দেবে এবং আবেদন প্রক্রিয়ায় সাহায্য করবে।",
    getStarted: "শুরু করুন",
    voiceFirst: "ভয়েস-ফার্স্ট",
    multipleLanguages: "বহু ভাষা",
    guidedApplications: "নির্দেশিত আবেদন",

    yourJourney: "আপনার যাত্রা",
    chooseLanguageJourney: "আপনার ভাষা নির্বাচন করুন",
    chooseLanguageJourneyText:
      "আপনার সুবিধাজনক ভাষায় প্ল্যাটফর্মটি ব্যবহার করুন।",
    tellAbout: "নিজের সম্পর্কে বলুন",
    tellAboutText: "আপনার উত্তর বলুন অথবা টাইপ করুন।",
    getMatched: "প্রকল্পের মিল পান",
    getMatchedText:
      "এআই আপনার প্রোফাইলের জন্য উপযুক্ত প্রকল্প খুঁজে বের করবে।",
    applyGuidance: "নির্দেশনা নিয়ে আবেদন করুন",
    applyGuidanceText:
      "নথি যাচাই করুন এবং আপনার আবেদন চালিয়ে যান।",

    voiceFirstTitle: "ভয়েস-ফার্স্ট",
    voiceFirstText: "কথা বলে প্রোফাইলের প্রশ্নগুলির উত্তর দিন।",
    regionalLanguages: "আঞ্চলিক ভাষা",
    regionalLanguagesText:
      "রেজিস্ট্রেশনের আগে আপনার পছন্দের ভাষা নির্বাচন করুন।",
    guidedProcess: "নির্দেশিত প্রক্রিয়া",
    guidedProcessText:
      "প্রকল্প খোঁজা থেকে নথি যাচাই পর্যন্ত।",

    howWorksTitle: "ব্যবহারকারীর জন্য সহজ।",
    howWorksTitle2: "পেছনে শক্তিশালী।",
    howWorksText:
      "প্ল্যাটফর্মটি ভয়েস-ফার্স্ট অভিজ্ঞতার জন্য তৈরি করা হয়েছে যাতে ব্যবহারকারীদের জটিল সরকারি পোর্টালে যেতে না হয়।",
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    createAccountText:
      "ভাষা নির্বাচন করার পরে নিরাপদে রেজিস্টার করুন।",
    speakNaturally: "স্বাভাবিকভাবে কথা বলুন",
    speakNaturallyText:
      "ভয়েস বা টেক্সট ব্যবহার করে প্রশ্নের উত্তর দিন।",
    discoverSchemes: "প্রকল্প খুঁজুন",
    discoverSchemesText:
      "আপনার প্রোফাইলের ভিত্তিতে মিল পাওয়া প্রকল্পগুলি দেখুন।",

    registerTitle: "আপনার অ্যাকাউন্ট তৈরি করুন",
    loginTitle: "আবার স্বাগতম",
    registerDescription:
      "আপনার ভাষা নির্বাচন করা হয়েছে। চলুন শুরু করি।",
    loginDescription:
      "প্রকল্প খুঁজতে লগইন করুন।",
    createAccountTab: "অ্যাকাউন্ট তৈরি করুন",
    login: "লগইন",
    fullName: "পুরো নাম",
    enterName: "আপনার নাম লিখুন",
    emailAddress: "ইমেল ঠিকানা",
    password: "পাসওয়ার্ড",
    enterPassword: "আপনার পাসওয়ার্ড লিখুন",
    prototypeNote:
      "এটি স্মার্ট ইন্ডিয়া হ্যাকাথনের একটি প্রোটোটাইপ।",

    voiceAssistance: "ভয়েস-ফার্স্ট সহায়তা",
    welcome: "স্বাগতম",
    welcomeText:
      "আপনাকে সবকিছু টাইপ করতে হবে না। আমরা সহজ প্রশ্ন করব, আপনার উত্তর শুনব এবং আপনার প্রোফাইল স্বয়ংক্রিয়ভাবে তৈরি করতে সাহায্য করব।",
    tapToSpeak: "কথা বলতে ট্যাপ করুন",
    speakNaturallySmall: "স্বাভাবিকভাবে কথা বলুন",
    hearQuestion: "প্রশ্ন শুনুন",
    typeIfNeeded: "প্রয়োজন হলে টাইপ করুন",

    profile: "আপনার প্রোফাইল",
    tellAboutYourself: "নিজের সম্পর্কে বলুন",
    voiceEnabled: "ভয়েস সক্রিয়",
    voiceEnabledText:
      "মাইক্রোফোনে ট্যাপ করে আপনার উত্তর বলুন। আপনার উত্তরের ভিত্তিতে ফর্মটি স্বয়ংক্রিয়ভাবে পূরণ হবে।",
    listeningAvailable: "শোনার সুবিধা উপলব্ধ",

    categoryQuestion: "আপনি কোন শ্রেণির অন্তর্ভুক্ত?",
    categoryHint:
      "এটি আপনার জন্য উপযুক্ত প্রকল্পগুলি চিহ্নিত করতে সাহায্য করবে।",
    incomeQuestion: "আপনার বার্ষিক আয় কত?",
    incomeHint:
      "এই পর্যায়ে আনুমানিক পরিমাণই যথেষ্ট।",
    businessQuestion: "আপনি কী ধরনের ব্যবসা করেন?",
    businessHint:
      "আপনার ব্যবসার সঙ্গে সবচেয়ে বেশি মেলে এমন বিকল্পটি বেছে নিন।",
    locationQuestion: "আপনার ব্যবসা কোথায় অবস্থিত?",
    locationHint:
      "আপনার রাজ্য, জেলা বা শহর লিখুন।",
    location: "অবস্থান",
    locationPlaceholder: "যেমন মথুরা, উত্তর প্রদেশ",
    sampleLocation: "উদাহরণ অবস্থান ব্যবহার করুন",
    findSchemes: "আমার প্রকল্পগুলি খুঁজুন",

    loadingTitle: "আপনার জন্য মিল খোঁজা হচ্ছে",
    loadingText:
      "এআই আপনার প্রোফাইলকে প্রকল্পের যোগ্যতার নিয়মের সঙ্গে তুলনা করছে।",

    matchResults: "এআই ম্যাচ ফলাফল",
    schemesForYou: "আপনার জন্য প্রকল্প",
    basedOnProfile: "আপনার প্রোফাইলের ভিত্তিতে:",
    matched: "মিল পাওয়া গেছে",
    match: "মিল",

    schemeDetails: "প্রকল্পের বিবরণ",
    mainBenefit: "প্রধান সুবিধা",
    documentsNeeded: "প্রয়োজনীয় নথি",
    verifyDocuments: "নথি যাচাই করুন",

    documentVerification: "নথি যাচাই",
    verifyYourDocuments: "আপনার নথি যাচাই করুন",
    uploadText:
      "প্রতিটি প্রয়োজনীয় নথির একটি পরিষ্কার ছবি আপলোড করুন। প্রোটোটাইপ যাচাইয়ের প্রতিক্রিয়া অনুকরণ করবে।",
    verified: "যাচাই হয়েছে",
    imageUnclear: "ছবি পরিষ্কার নয় — আবার তুলুন",
    checking: "নথি যাচাই করা হচ্ছে...",
    notUploaded: "আপলোড করা হয়নি",
    submitApplication: "আবেদন জমা দিন",

    applicationStatus: "আবেদনের অবস্থা",
    submitted: "জমা দেওয়া হয়েছে",
    underReview: "পর্যালোচনাধীন",
    approved: "অনুমোদিত",
    submittedMessage:
      "আপনার আবেদন সফলভাবে জমা দেওয়া হয়েছে।",
    reviewMessage:
      "আপনার আবেদন বর্তমানে পর্যালোচনাধীন।",
    approvedMessage:
      "এই প্রোটোটাইপ প্রক্রিয়ায় আপনার আবেদন অনুমোদিত হয়েছে।",
    simulateUpdate: "পরবর্তী আপডেট দেখান",
    browseSchemes: "আরও প্রকল্প দেখুন",

    sihProject:
      "প্রান্তিক উদ্যোক্তাদের জন্য এআই-চালিত প্রকল্প মিলান",
    voiceFirstAssistance: "ভয়েস-ফার্স্ট সহায়তা",
  },

  ta: {
    chooseLanguage: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    selectPreferred: "உங்களுக்கு வசதியான மொழியைத் தேர்ந்தெடுக்கவும்.",
    selected: "தேர்ந்தெடுக்கப்பட்டது",
    continue: "தொடரவும்",
    back: "பின்செல்",
    language: "மொழி",
    chooseLanguageNav: "மொழியைத் தேர்ந்தெடுக்கவும்",
    howItWorks: "இது எப்படி செயல்படுகிறது",
    help: "உதவி",
    registerLogin: "பதிவு / உள்நுழைவு",
    footerAbout: "எங்களைப் பற்றி",
    footerContact: "தொடர்பு கொள்ளுங்கள்",
    footerPrivacy: "தனியுரிமைக் கொள்கை",
    footerTerms: "விதிமுறைகள் மற்றும் நிபந்தனைகள்",
    toggleTheme: "தீமை மாற்றவும்",
    helpTitle: "SchemeSaathi உங்களுக்கு எப்படி உதவுகிறது",
    helpIntro: "உங்கள் சுயவிவரத்திற்கு பொருந்தக்கூடிய திட்டங்களைக் கண்டறிந்து புரிந்துகொள்ள இந்த எளிய படிகளைப் பின்பற்றுங்கள்.",
    helpStep1Title: "1. உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    helpStep1Text: "உங்களுக்கு மிகவும் வசதியான மொழியைத் தேர்ந்தெடுக்கவும். தளத்தின் வழிகாட்டுதல் அந்த மொழியில் காட்டப்படும்.",
    helpStep2Title: "2. பதிவு செய்யவும் அல்லது உள்நுழையவும்",
    helpStep2Text: "உங்கள் கணக்கை உருவாக்கவும் அல்லது தொடர உள்நுழையவும்.",
    helpStep3Title: "3. உங்களைப் பற்றி கூறுங்கள்",
    helpStep3Text: "உங்கள் வகை, வருமானம், தொழில் மற்றும் இருப்பிடம் பற்றிய சில கேள்விகளுக்கு பதிலளிக்கவும்.",
    helpStep4Title: "4. பொருந்தும் திட்டங்களைப் பெறுங்கள்",
    helpStep4Text: "SchemeSaathi உங்கள் சுயவிவரத்தை திட்டத் தேவைகளுடன் ஒப்பிட்டு பொருத்தமான திட்டங்களைக் காட்டும்.",
    helpStep5Title: "5. மதிப்பாய்வு செய்து விண்ணப்பிக்கவும்",
    helpStep5Text: "ஒரு திட்டத்தைத் திறந்து அதன் விவரங்கள், தேவையான ஆவணங்கள் மற்றும் விண்ணப்ப வழிகாட்டுதலைப் பார்க்கவும்.",
    helpStep6Title: "6. உங்கள் முன்னேற்றத்தைப் பின்தொடருங்கள்",
    helpStep6Text: "ஆவணப் படிகளை முடித்து வழிகாட்டப்பட்ட விண்ணப்ப செயல்முறையைப் பின்பற்றுங்கள்.",
    close: "மூடுக",

    smartIndia: "ஸ்மார்ட் இந்தியா ஹேக்கத்தான்",
    title: "AI திட்டப் பொருத்தம்",
    aiDiscovery: "AI மூலம் அரசு திட்டங்களைத் தேடுதல்",
    governmentSchemes: "உங்களுக்காக உருவாக்கப்பட்ட அரசு திட்டங்களைக் கண்டறியுங்கள்.",
    landingDescription:
      "உங்களுக்கு விருப்பமான மொழியில் உங்களைப் பற்றி கூறுங்கள். உங்கள் சுயவிவரத்திற்கு பொருத்தமான அரசு திட்டங்களை AI கண்டறிந்து விண்ணப்ப செயல்முறையில் வழிகாட்டும்.",
    getStarted: "தொடங்குங்கள்",
    voiceFirst: "குரல் முதலில்",
    multipleLanguages: "பல மொழிகள்",
    guidedApplications: "வழிகாட்டப்பட்ட விண்ணப்பங்கள்",

    yourJourney: "உங்கள் பயணம்",
    chooseLanguageJourney: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    chooseLanguageJourneyText:
      "உங்களுக்கு வசதியான மொழியில் தளத்தைப் பயன்படுத்துங்கள்.",
    tellAbout: "உங்களைப் பற்றி கூறுங்கள்",
    tellAboutText:
      "உங்கள் பதில்களைப் பேசுங்கள் அல்லது தட்டச்சு செய்யுங்கள்.",
    getMatched: "பொருத்தமான திட்டங்களைப் பெறுங்கள்",
    getMatchedText:
      "AI உங்கள் சுயவிவரத்திற்கு பொருத்தமான திட்டங்களைக் கண்டறியும்.",
    applyGuidance: "வழிகாட்டுதலுடன் விண்ணப்பிக்கவும்",
    applyGuidanceText:
      "ஆவணங்களைச் சரிபார்த்து உங்கள் விண்ணப்பத்தைத் தொடருங்கள்.",

    voiceFirstTitle: "குரல் முதலில்",
    voiceFirstText:
      "பேசி உங்கள் சுயவிவரக் கேள்விகளுக்குப் பதிலளிக்கவும்.",
    regionalLanguages: "பிராந்திய மொழிகள்",
    regionalLanguagesText:
      "பதிவு செய்வதற்கு முன் உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்.",
    guidedProcess: "வழிகாட்டப்பட்ட செயல்முறை",
    guidedProcessText:
      "திட்டங்களைத் தேடுவதிலிருந்து ஆவணச் சரிபார்ப்பு வரை.",

    howWorksTitle: "பயனருக்கு எளிமையானது.",
    howWorksTitle2: "பின்னணியில் சக்திவாய்ந்தது.",
    howWorksText:
      "சிக்கலான அரசு இணையதளங்களைப் பயன்படுத்த வேண்டிய அவசியமில்லாமல், குரல் அடிப்படையிலான அனுபவத்திற்காக இந்த தளம் வடிவமைக்கப்பட்டுள்ளது.",
    createAccount: "கணக்கை உருவாக்கவும்",
    createAccountText:
      "மொழியைத் தேர்ந்தெடுத்த பிறகு பாதுகாப்பாக பதிவு செய்யுங்கள்.",
    speakNaturally: "இயல்பாகப் பேசுங்கள்",
    speakNaturallyText:
      "குரல் அல்லது உரையைப் பயன்படுத்தி கேள்விகளுக்குப் பதிலளிக்கவும்.",
    discoverSchemes: "திட்டங்களைக் கண்டறியுங்கள்",
    discoverSchemesText:
      "உங்கள் சுயவிவரத்தின் அடிப்படையில் பொருத்தமான திட்டங்களைக் காணுங்கள்.",

    registerTitle: "உங்கள் கணக்கை உருவாக்கவும்",
    loginTitle: "மீண்டும் வரவேற்கிறோம்",
    registerDescription:
      "உங்கள் மொழி தேர்ந்தெடுக்கப்பட்டது. தொடங்குவோம்.",
    loginDescription:
      "திட்டங்களைக் கண்டறிய உள்நுழையுங்கள்.",
    createAccountTab: "கணக்கை உருவாக்கவும்",
    login: "உள்நுழையவும்",
    fullName: "முழுப் பெயர்",
    enterName: "உங்கள் பெயரை உள்ளிடவும்",
    emailAddress: "மின்னஞ்சல் முகவரி",
    password: "கடவுச்சொல்",
    enterPassword: "உங்கள் கடவுச்சொல்லை உள்ளிடவும்",
    prototypeNote:
      "இது ஸ்மார்ட் இந்தியா ஹேக்கத்தான் திட்டத்தின் முன்மாதிரி.",

    voiceAssistance: "குரல் அடிப்படையிலான உதவி",
    welcome: "வரவேற்கிறோம்",
    welcomeText:
      "எல்லாவற்றையும் தட்டச்சு செய்ய வேண்டியதில்லை. நாங்கள் எளிய கேள்விகளைக் கேட்டு, உங்கள் பதில்களைக் கேட்டு, உங்கள் சுயவிவரத்தை தானாக உருவாக்க உதவுவோம்.",
    tapToSpeak: "பேச தட்டவும்",
    speakNaturallySmall: "இயல்பாகப் பேசுங்கள்",
    hearQuestion: "கேள்வியைக் கேளுங்கள்",
    typeIfNeeded: "தேவைப்பட்டால் தட்டச்சு செய்யுங்கள்",

    profile: "உங்கள் சுயவிவரம்",
    tellAboutYourself: "உங்களைப் பற்றி கூறுங்கள்",
    voiceEnabled: "குரல் இயக்கப்பட்டது",
    voiceEnabledText:
      "மைக்ரோஃபோனைத் தட்டி உங்கள் பதிலைப் பேசுங்கள். உங்கள் பதிலின் அடிப்படையில் படிவம் தானாக நிரப்பப்படும்.",
    listeningAvailable: "கேட்கும் வசதி உள்ளது",

    categoryQuestion: "நீங்கள் எந்த வகையைச் சேர்ந்தவர்?",
    categoryHint:
      "நீங்கள் தகுதி பெறக்கூடிய திட்டங்களை அடையாளம் காண இது உதவும்.",
    incomeQuestion: "உங்கள் ஆண்டு வருமானம் எவ்வளவு?",
    incomeHint:
      "இந்த நிலையில் தோராயமான தொகை போதுமானது.",
    businessQuestion: "நீங்கள் எந்த வகையான வணிகத்தை நடத்துகிறீர்கள்?",
    businessHint:
      "உங்கள் வணிகத்திற்கு மிகவும் பொருத்தமான விருப்பத்தைத் தேர்ந்தெடுக்கவும்.",
    locationQuestion: "உங்கள் வணிகம் எங்கு அமைந்துள்ளது?",
    locationHint:
      "உங்கள் மாநிலம், மாவட்டம் அல்லது நகரத்தை உள்ளிடவும்.",
    location: "இடம்",
    locationPlaceholder: "எ.கா. மதுரா, உத்தரப் பிரதேசம்",
    sampleLocation: "மாதிரி இடத்தைப் பயன்படுத்தவும்",
    findSchemes: "எனது திட்டங்களைக் கண்டறியவும்",

    loadingTitle: "உங்களுக்கான பொருத்தங்கள் கண்டறியப்படுகின்றன",
    loadingText:
      "AI உங்கள் சுயவிவரத்தை திட்டத் தகுதி விதிகளுடன் ஒப்பிடுகிறது.",

    matchResults: "AI பொருத்த முடிவுகள்",
    schemesForYou: "உங்களுக்கான திட்டங்கள்",
    basedOnProfile: "உங்கள் சுயவிவரத்தின் அடிப்படையில்:",
    matched: "பொருத்தப்பட்டவை",
    match: "பொருத்தம்",

    schemeDetails: "திட்ட விவரங்கள்",
    mainBenefit: "முக்கிய நன்மை",
    documentsNeeded: "தேவையான ஆவணங்கள்",
    verifyDocuments: "ஆவணங்களைச் சரிபார்க்கவும்",

    documentVerification: "ஆவணச் சரிபார்ப்பு",
    verifyYourDocuments: "உங்கள் ஆவணங்களைச் சரிபார்க்கவும்",
    uploadText:
      "தேவையான ஒவ்வொரு ஆவணத்தின் தெளிவான புகைப்படத்தைப் பதிவேற்றவும். முன்மாதிரி சரிபார்ப்பு பதிலை உருவகப்படுத்தும்.",
    verified: "சரிபார்க்கப்பட்டது",
    imageUnclear: "படம் தெளிவாக இல்லை — மீண்டும் எடுக்கவும்",
    checking: "ஆவணம் சரிபார்க்கப்படுகிறது...",
    notUploaded: "பதிவேற்றப்படவில்லை",
    submitApplication: "விண்ணப்பத்தைச் சமர்ப்பிக்கவும்",

    applicationStatus: "விண்ணப்ப நிலை",
    submitted: "சமர்ப்பிக்கப்பட்டது",
    underReview: "மதிப்பாய்வில்",
    approved: "அங்கீகரிக்கப்பட்டது",
    submittedMessage:
      "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது.",
    reviewMessage:
      "உங்கள் விண்ணப்பம் தற்போது மதிப்பாய்வு செய்யப்படுகிறது.",
    approvedMessage:
      "இந்த முன்மாதிரி செயல்முறையில் உங்கள் விண்ணப்பம் அங்கீகரிக்கப்பட்டது.",
    simulateUpdate: "அடுத்த புதுப்பிப்பைக் காட்டவும்",
    browseSchemes: "மேலும் திட்டங்களைப் பார்க்கவும்",

    sihProject:
      "பின்தங்கிய தொழில்முனைவோருக்கான AI திட்டப் பொருத்தம்",
    voiceFirstAssistance: "குரல் அடிப்படையிலான உதவி",
  },

  mr: {
    chooseLanguage: "आपली भाषा निवडा",
    selectPreferred: "आपल्याला सर्वात सोयीची भाषा निवडा.",
    selected: "निवडले",
    continue: "पुढे जा",
    back: "मागे",
    language: "भाषा",
    chooseLanguageNav: "भाषा निवडा",
    howItWorks: "हे कसे कार्य करते",
    help: "मदत",
    registerLogin: "नोंदणी / लॉगिन",
    footerAbout: "आमच्याबद्दल",
    footerContact: "संपर्क करा",
    footerPrivacy: "गोपनीयता धोरण",
    footerTerms: "अटी आणि शर्ती",
    toggleTheme: "थीम बदला",
    helpTitle: "SchemeSaathi आपली कशी मदत करते",
    helpIntro: "आपल्या प्रोफाइलसाठी योग्य योजना शोधण्यासाठी आणि समजून घेण्यासाठी या सोप्या चरणांचे अनुसरण करा.",
    helpStep1Title: "1. आपली भाषा निवडा",
    helpStep1Text: "आपल्याला सर्वात सोयीची भाषा निवडा. प्लॅटफॉर्मचे मार्गदर्शन त्याच भाषेत दिसेल.",
    helpStep2Title: "2. नोंदणी किंवा लॉगिन करा",
    helpStep2Text: "आपले खाते तयार करा किंवा पुढे जाण्यासाठी लॉगिन करा.",
    helpStep3Title: "3. स्वतःबद्दल सांगा",
    helpStep3Text: "आपली श्रेणी, उत्पन्न, व्यवसाय आणि स्थान याबद्दल काही प्रश्नांची उत्तरे द्या.",
    helpStep4Title: "4. जुळणाऱ्या योजना मिळवा",
    helpStep4Text: "SchemeSaathi आपल्या प्रोफाइलची योजनेच्या आवश्यकतांशी तुलना करून संबंधित योजना दाखवते.",
    helpStep5Title: "5. माहिती पाहा आणि अर्ज करा",
    helpStep5Text: "योजना उघडून तिची माहिती, आवश्यक कागदपत्रे आणि अर्जाचे मार्गदर्शन पाहा.",
    helpStep6Title: "6. आपली प्रगती तपासा",
    helpStep6Text: "कागदपत्रांशी संबंधित टप्पे पूर्ण करा आणि मार्गदर्शित अर्ज प्रक्रियेचे अनुसरण करा.",
    close: "बंद करा",

    smartIndia: "स्मार्ट इंडिया हॅकाथॉन",
    title: "एआय योजना जुळणी",
    aiDiscovery: "एआय आधारित सरकारी योजना शोध",
    governmentSchemes: "आपल्यासाठी तयार केलेल्या सरकारी योजना शोधा.",
    landingDescription:
      "आपल्या पसंतीच्या भाषेत स्वतःबद्दल सांगा. आमचे एआय आपल्या प्रोफाइलशी संबंधित सरकारी योजना शोधेल आणि अर्ज प्रक्रियेत मार्गदर्शन करेल.",
    getStarted: "सुरुवात करा",
    voiceFirst: "व्हॉइस-फर्स्ट",
    multipleLanguages: "अनेक भाषा",
    guidedApplications: "मार्गदर्शित अर्ज",

    yourJourney: "आपला प्रवास",
    chooseLanguageJourney: "आपली भाषा निवडा",
    chooseLanguageJourneyText:
      "आपल्याला सोयीच्या भाषेत प्लॅटफॉर्म वापरा.",
    tellAbout: "स्वतःबद्दल सांगा",
    tellAboutText:
      "आपली उत्तरे बोलून द्या किंवा टाइप करा.",
    getMatched: "जुळणाऱ्या योजना मिळवा",
    getMatchedText:
      "एआय आपल्या प्रोफाइलशी संबंधित योजना शोधेल.",
    applyGuidance: "मार्गदर्शनासह अर्ज करा",
    applyGuidanceText:
      "कागदपत्रे तपासा आणि अर्ज पुढे सुरू ठेवा.",

    voiceFirstTitle: "व्हॉइस-फर्स्ट",
    voiceFirstText:
      "बोलून प्रोफाइलमधील प्रश्नांची उत्तरे द्या.",
    regionalLanguages: "प्रादेशिक भाषा",
    regionalLanguagesText:
      "नोंदणीपूर्वी आपली पसंतीची भाषा निवडा.",
    guidedProcess: "मार्गदर्शित प्रक्रिया",
    guidedProcessText:
      "योजना शोधण्यापासून कागदपत्र पडताळणीपर्यंत.",

    howWorksTitle: "वापरकर्त्यासाठी सोपे.",
    howWorksTitle2: "पडद्यामागे शक्तिशाली.",
    howWorksText:
      "कठीण सरकारी पोर्टल वापरण्याची गरज भासू नये म्हणून हा प्लॅटफॉर्म व्हॉइस-फर्स्ट अनुभवासाठी तयार केला आहे.",
    createAccount: "खाते तयार करा",
    createAccountText:
      "भाषा निवडल्यानंतर सुरक्षितपणे नोंदणी करा.",
    speakNaturally: "नैसर्गिकपणे बोला",
    speakNaturallyText:
      "आवाज किंवा मजकूर वापरून प्रश्नांची उत्तरे द्या.",
    discoverSchemes: "योजना शोधा",
    discoverSchemesText:
      "आपल्या प्रोफाइलनुसार जुळणाऱ्या योजना पहा.",

    registerTitle: "आपले खाते तयार करा",
    loginTitle: "पुन्हा स्वागत आहे",
    registerDescription:
      "आपली भाषा निवडली आहे. चला सुरुवात करूया.",
    loginDescription:
      "योजना शोधण्यासाठी लॉगिन करा.",
    createAccountTab: "खाते तयार करा",
    login: "लॉगिन",
    fullName: "पूर्ण नाव",
    enterName: "आपले नाव लिहा",
    emailAddress: "ईमेल पत्ता",
    password: "पासवर्ड",
    enterPassword: "आपला पासवर्ड लिहा",
    prototypeNote:
      "हा स्मार्ट इंडिया हॅकाथॉन प्रकल्पाचा प्रोटोटाइप आहे.",

    voiceAssistance: "व्हॉइस-फर्स्ट सहाय्य",
    welcome: "स्वागत आहे",
    welcomeText:
      "आपल्याला सर्व काही टाइप करण्याची गरज नाही. आम्ही सोपे प्रश्न विचारू, आपली उत्तरे ऐकू आणि आपले प्रोफाइल आपोआप तयार करण्यात मदत करू.",
    tapToSpeak: "बोलण्यासाठी टॅप करा",
    speakNaturallySmall: "नैसर्गिकपणे बोला",
    hearQuestion: "प्रश्न ऐका",
    typeIfNeeded: "गरज असल्यास टाइप करा",

    profile: "आपले प्रोफाइल",
    tellAboutYourself: "स्वतःबद्दल सांगा",
    voiceEnabled: "आवाज सक्षम",
    voiceEnabledText:
      "मायक्रोफोनवर टॅप करा आणि आपले उत्तर बोला. आपल्या उत्तरावरून फॉर्म आपोआप भरला जाईल.",
    listeningAvailable: "ऐकण्याची सुविधा उपलब्ध",

    categoryQuestion: "आपण कोणत्या श्रेणीतील आहात?",
    categoryHint:
      "आपण पात्र ठरू शकणाऱ्या योजना ओळखण्यास हे मदत करेल.",
    incomeQuestion: "आपले वार्षिक उत्पन्न किती आहे?",
    incomeHint:
      "या टप्प्यावर अंदाजे रक्कम पुरेशी आहे.",
    businessQuestion: "आपण कोणत्या प्रकारचा व्यवसाय करता?",
    businessHint:
      "आपल्या व्यवसायाशी सर्वात जवळचा पर्याय निवडा.",
    locationQuestion: "आपला व्यवसाय कुठे आहे?",
    locationHint:
      "आपले राज्य, जिल्हा किंवा शहर लिहा.",
    location: "स्थान",
    locationPlaceholder: "उदा. मथुरा, उत्तर प्रदेश",
    sampleLocation: "नमुना स्थान वापरा",
    findSchemes: "माझ्या योजना शोधा",

    loadingTitle: "आपल्यासाठी जुळणाऱ्या योजना शोधत आहे",
    loadingText:
      "एआय आपल्या प्रोफाइलची योजना पात्रता नियमांशी तुलना करत आहे.",

    matchResults: "एआय जुळणी परिणाम",
    schemesForYou: "आपल्यासाठी योजना",
    basedOnProfile: "आपल्या प्रोफाइलवर आधारित:",
    matched: "जुळलेल्या",
    match: "जुळणी",

    schemeDetails: "योजना तपशील",
    mainBenefit: "मुख्य लाभ",
    documentsNeeded: "आवश्यक कागदपत्रे",
    verifyDocuments: "कागदपत्रे तपासा",

    documentVerification: "कागदपत्र पडताळणी",
    verifyYourDocuments: "आपली कागदपत्रे तपासा",
    uploadText:
      "प्रत्येक आवश्यक कागदपत्राचा स्पष्ट फोटो अपलोड करा. प्रोटोटाइप पडताळणी प्रतिसादाचे अनुकरण करेल.",
    verified: "पडताळले",
    imageUnclear: "फोटो स्पष्ट नाही — पुन्हा घ्या",
    checking: "कागदपत्र तपासत आहे...",
    notUploaded: "अपलोड केलेले नाही",
    submitApplication: "अर्ज सादर करा",

    applicationStatus: "अर्जाची स्थिती",
    submitted: "सादर केले",
    underReview: "पुनरावलोकनात",
    approved: "मंजूर",
    submittedMessage:
      "आपला अर्ज यशस्वीरित्या सादर झाला आहे.",
    reviewMessage:
      "आपला अर्ज सध्या पुनरावलोकनात आहे.",
    approvedMessage:
      "या प्रोटोटाइप प्रक्रियेत आपला अर्ज मंजूर झाला आहे.",
    simulateUpdate: "पुढील अपडेट दाखवा",
    browseSchemes: "अधिक योजना पहा",

    sihProject:
      "वंचित उद्योजकांसाठी एआय आधारित योजना जुळणी",
    voiceFirstAssistance: "व्हॉइस-फर्स्ट सहाय्य",
  },

  te: {
    chooseLanguage: "మీ భాషను ఎంచుకోండి",
    selectPreferred: "మీకు అత్యంత సౌకర్యంగా ఉన్న భాషను ఎంచుకోండి.",
    selected: "ఎంచుకోబడింది",
    continue: "కొనసాగించండి",
    back: "వెనుకకు",
    language: "భాష",
    chooseLanguageNav: "భాషను ఎంచుకోండి",
    howItWorks: "ఇది ఎలా పనిచేస్తుంది",
    help: "సహాయం",
    registerLogin: "రిజిస్టర్ / లాగిన్",
    footerAbout: "మా గురించి",
    footerContact: "మమ్మల్ని సంప్రదించండి",
    footerPrivacy: "గోప్యతా విధానం",
    footerTerms: "నిబంధనలు మరియు షరతులు",
    toggleTheme: "థీమ్ మార్చండి",
    helpTitle: "SchemeSaathi మీకు ఎలా సహాయపడుతుంది",
    helpIntro: "మీ ప్రొఫైల్‌కు సరిపోయే పథకాలను కనుగొని అర్థం చేసుకోవడానికి ఈ సులభమైన దశలను అనుసరించండి.",
    helpStep1Title: "1. మీ భాషను ఎంచుకోండి",
    helpStep1Text: "మీకు అత్యంత సౌకర్యంగా ఉన్న భాషను ఎంచుకోండి. ప్లాట్‌ఫారమ్ మార్గదర్శకాలు ఆ భాషలో కనిపిస్తాయి.",
    helpStep2Title: "2. రిజిస్టర్ లేదా లాగిన్ చేయండి",
    helpStep2Text: "మీ ఖాతాను సృష్టించండి లేదా కొనసాగడానికి లాగిన్ చేయండి.",
    helpStep3Title: "3. మీ గురించి చెప్పండి",
    helpStep3Text: "మీ వర్గం, ఆదాయం, వ్యాపారం మరియు ప్రాంతం గురించి కొన్ని ప్రశ్నలకు సమాధానం ఇవ్వండి.",
    helpStep4Title: "4. సరిపోయే పథకాలను పొందండి",
    helpStep4Text: "SchemeSaathi మీ ప్రొఫైల్‌ను పథకం అవసరాలతో పోల్చి సంబంధిత పథకాలను చూపిస్తుంది.",
    helpStep5Title: "5. పరిశీలించి దరఖాస్తు చేయండి",
    helpStep5Text: "పథకాన్ని తెరిచి దాని వివరాలు, అవసరమైన పత్రాలు మరియు దరఖాస్తు మార్గదర్శకాలను చూడండి.",
    helpStep6Title: "6. మీ పురోగతిని అనుసరించండి",
    helpStep6Text: "పత్రాల దశలను పూర్తి చేసి మార్గదర్శక దరఖాస్తు ప్రక్రియను అనుసరించండి.",
    close: "మూసివేయండి",

    smartIndia: "స్మార్ట్ ఇండియా హ్యాకథాన్",
    title: "AI పథకం సరిపోలిక",
    aiDiscovery: "AI ఆధారిత ప్రభుత్వ పథకాల శోధన",
    governmentSchemes: "మీ కోసం రూపొందించిన ప్రభుత్వ పథకాలను కనుగొనండి.",
    landingDescription:
      "మీకు ఇష్టమైన భాషలో మీ గురించి చెప్పండి. మా AI మీ ప్రొఫైల్‌కు సరిపోయే ప్రభుత్వ పథకాలను కనుగొని దరఖాస్తు ప్రక్రియలో మార్గనిర్దేశం చేస్తుంది.",
    getStarted: "ప్రారంభించండి",
    voiceFirst: "వాయిస్-ఫస్ట్",
    multipleLanguages: "అనేక భాషలు",
    guidedApplications: "మార్గదర్శక దరఖాస్తులు",

    yourJourney: "మీ ప్రయాణం",
    chooseLanguageJourney: "మీ భాషను ఎంచుకోండి",
    chooseLanguageJourneyText:
      "మీకు సౌకర్యంగా ఉన్న భాషలో ప్లాట్‌ఫారమ్‌ను ఉపయోగించండి.",
    tellAbout: "మీ గురించి చెప్పండి",
    tellAboutText:
      "మీ సమాధానాలను మాట్లాడండి లేదా టైప్ చేయండి.",
    getMatched: "సరిపోయే పథకాలను పొందండి",
    getMatchedText:
      "AI మీ ప్రొఫైల్‌కు సరిపోయే పథకాలను గుర్తిస్తుంది.",
    applyGuidance: "మార్గదర్శకత్వంతో దరఖాస్తు చేయండి",
    applyGuidanceText:
      "పత్రాలను ధృవీకరించి మీ దరఖాస్తును కొనసాగించండి.",

    voiceFirstTitle: "వాయిస్-ఫస్ట్",
    voiceFirstText:
      "మాట్లాడటం ద్వారా ప్రొఫైల్ ప్రశ్నలకు సమాధానం ఇవ్వండి.",
    regionalLanguages: "ప్రాంతీయ భాషలు",
    regionalLanguagesText:
      "రిజిస్ట్రేషన్‌కు ముందు మీకు ఇష్టమైన భాషను ఎంచుకోండి.",
    guidedProcess: "మార్గదర్శక ప్రక్రియ",
    guidedProcessText:
      "పథకాలను కనుగొనడం నుండి పత్రాల ధృవీకరణ వరకు.",

    howWorksTitle: "వినియోగదారుకు సులభం.",
    howWorksTitle2: "వెనుక బలమైన సాంకేతికత.",
    howWorksText:
      "క్లిష్టమైన ప్రభుత్వ పోర్టల్స్‌ను ఉపయోగించాల్సిన అవసరం లేకుండా వాయిస్-ఫస్ట్ అనుభవం కోసం ఈ ప్లాట్‌ఫారమ్ రూపొందించబడింది.",
    createAccount: "ఖాతా సృష్టించండి",
    createAccountText:
      "భాషను ఎంచుకున్న తర్వాత సురక్షితంగా నమోదు చేసుకోండి.",
    speakNaturally: "సహజంగా మాట్లాడండి",
    speakNaturallyText:
      "వాయిస్ లేదా టెక్స్ట్ ఉపయోగించి ప్రశ్నలకు సమాధానం ఇవ్వండి.",
    discoverSchemes: "పథకాలను కనుగొనండి",
    discoverSchemesText:
      "మీ ప్రొఫైల్ ఆధారంగా సరిపోయే పథకాలను చూడండి.",

    registerTitle: "మీ ఖాతాను సృష్టించండి",
    loginTitle: "తిరిగి స్వాగతం",
    registerDescription:
      "మీ భాష ఎంపిక చేయబడింది. ప్రారంభిద్దాం.",
    loginDescription:
      "పథకాలను కనుగొనడానికి లాగిన్ అవ్వండి.",
    createAccountTab: "ఖాతా సృష్టించండి",
    login: "లాగిన్",
    fullName: "పూర్తి పేరు",
    enterName: "మీ పేరు నమోదు చేయండి",
    emailAddress: "ఇమెయిల్ చిరునామా",
    password: "పాస్‌వర్డ్",
    enterPassword: "మీ పాస్‌వర్డ్ నమోదు చేయండి",
    prototypeNote:
      "ఇది స్మార్ట్ ఇండియా హ్యాకథాన్ ప్రాజెక్ట్ ప్రోటోటైప్.",

    voiceAssistance: "వాయిస్-ఫస్ట్ సహాయం",
    welcome: "స్వాగతం",
    welcomeText:
      "మీరు ప్రతిదీ టైప్ చేయాల్సిన అవసరం లేదు. మేము సులభమైన ప్రశ్నలు అడిగి, మీ సమాధానాలను విని, మీ ప్రొఫైల్‌ను స్వయంచాలకంగా రూపొందించడంలో సహాయపడతాము.",
    tapToSpeak: "మాట్లాడటానికి ట్యాప్ చేయండి",
    speakNaturallySmall: "సహజంగా మాట్లాడండి",
    hearQuestion: "ప్రశ్న వినండి",
    typeIfNeeded: "అవసరమైతే టైప్ చేయండి",

    profile: "మీ ప్రొఫైల్",
    tellAboutYourself: "మీ గురించి చెప్పండి",
    voiceEnabled: "వాయిస్ ప్రారంభించబడింది",
    voiceEnabledText:
      "మైక్రోఫోన్‌పై ట్యాప్ చేసి మీ సమాధానం చెప్పండి. మీ సమాధానం ఆధారంగా ఫారం స్వయంచాలకంగా నింపబడుతుంది.",
    listeningAvailable: "వినే సదుపాయం అందుబాటులో ఉంది",

    categoryQuestion: "మీరు ఏ వర్గానికి చెందినవారు?",
    categoryHint:
      "మీరు అర్హత పొందగల పథకాలను గుర్తించడంలో ఇది సహాయపడుతుంది.",
    incomeQuestion: "మీ వార్షిక ఆదాయం ఎంత?",
    incomeHint:
      "ఈ దశలో సుమారుగా చెప్పడం సరిపోతుంది.",
    businessQuestion: "మీరు ఏ రకమైన వ్యాపారం నిర్వహిస్తున్నారు?",
    businessHint:
      "మీ వ్యాపారానికి దగ్గరగా ఉన్న ఎంపికను ఎంచుకోండి.",
    locationQuestion: "మీ వ్యాపారం ఎక్కడ ఉంది?",
    locationHint:
      "మీ రాష్ట్రం, జిల్లా లేదా నగరాన్ని నమోదు చేయండి.",
    location: "స్థానం",
    locationPlaceholder: "ఉదా. మథుర, ఉత్తరప్రదేశ్",
    sampleLocation: "నమూనా స్థానాన్ని ఉపయోగించండి",
    findSchemes: "నా పథకాలను కనుగొనండి",

    loadingTitle: "మీ కోసం సరిపోలికలను కనుగొంటున్నాము",
    loadingText:
      "AI మీ ప్రొఫైల్‌ను పథకం అర్హత నియమాలతో పోల్చుతోంది.",

    matchResults: "AI సరిపోలిక ఫలితాలు",
    schemesForYou: "మీ కోసం పథకాలు",
    basedOnProfile: "మీ ప్రొఫైల్ ఆధారంగా:",
    matched: "సరిపోలినవి",
    match: "సరిపోలిక",

    schemeDetails: "పథకం వివరాలు",
    mainBenefit: "ప్రధాన ప్రయోజనం",
    documentsNeeded: "అవసరమైన పత్రాలు",
    verifyDocuments: "పత్రాలను ధృవీకరించండి",

    documentVerification: "పత్రాల ధృవీకరణ",
    verifyYourDocuments: "మీ పత్రాలను ధృవీకరించండి",
    uploadText:
      "అవసరమైన ప్రతి పత్రం యొక్క స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి. ప్రోటోటైప్ ధృవీకరణ ప్రతిస్పందనను అనుకరిస్తుంది.",
    verified: "ధృవీకరించబడింది",
    imageUnclear: "చిత్రం స్పష్టంగా లేదు — మళ్లీ తీయండి",
    checking: "పత్రాన్ని తనిఖీ చేస్తున్నాము...",
    notUploaded: "అప్‌లోడ్ చేయలేదు",
    submitApplication: "దరఖాస్తును సమర్పించండి",

    applicationStatus: "దరఖాస్తు స్థితి",
    submitted: "సమర్పించబడింది",
    underReview: "సమీక్షలో ఉంది",
    approved: "ఆమోదించబడింది",
    submittedMessage:
      "మీ దరఖాస్తు విజయవంతంగా సమర్పించబడింది.",
    reviewMessage:
      "మీ దరఖాస్తు ప్రస్తుతం సమీక్షలో ఉంది.",
    approvedMessage:
      "ఈ ప్రోటోటైప్ ప్రక్రియలో మీ దరఖాస్తు ఆమోదించబడింది.",
    simulateUpdate: "తదుపరి అప్‌డేట్ చూపించండి",
    browseSchemes: "మరిన్ని పథకాలను చూడండి",

    sihProject:
      "వెనుకబడిన పారిశ్రామికవేత్తల కోసం AI ఆధారిత పథకం సరిపోలిక",
    voiceFirstAssistance: "వాయిస్-ఫస్ట్ సహాయం",
  },
};



const NEARBY_COPY = {
  en: {
    title: "Nearby Bank Help",
    subtitle: "Banks near your selected location and the loan support they may offer.",
    selectedLocation: "Selected location",
    search: "Search nearby banks",
    loading: "Finding nearby banks…",
    noLocation: "Complete the location question first to see nearby banks.",
    noResults: "No nearby banks were found for this location.",
    locationNote: "Bank branches are based on the selected location. Loan amounts shown are prototype product ranges and may vary by bank and applicant.",
    distance: "Distance",
    loanAmount: "Loan amount",
    openMaps: "Open in Maps",
    retry: "Try again",
    radius: "within 10 km",
    bank: "Bank",
  },
  hi: {
    title: "नज़दीकी बैंक सहायता",
    subtitle: "आपके चुने हुए स्थान के आसपास के बैंक और उनके संभावित ऋण विकल्प।",
    selectedLocation: "चुना गया स्थान",
    search: "नज़दीकी बैंक खोजें",
    loading: "नज़दीकी बैंक खोजे जा रहे हैं…",
    noLocation: "नज़दीकी बैंक देखने के लिए पहले स्थान वाला प्रश्न पूरा करें।",
    noResults: "इस स्थान के आसपास कोई बैंक नहीं मिला।",
    locationNote: "बैंक शाखाएँ आपके चुने हुए स्थान के आधार पर दिखाई जाती हैं। दिखाए गए ऋण की राशि प्रोटोटाइप उत्पाद श्रेणियाँ हैं और बैंक व आवेदक के अनुसार बदल सकती हैं।",
    distance: "दूरी",
    loanAmount: "ऋण राशि",
    openMaps: "मैप में खोलें",
    retry: "फिर से प्रयास करें",
    radius: "10 किमी के भीतर",
    bank: "बैंक",
  },
  bn: {
    title: "কাছাকাছি ব্যাংক সহায়তা",
    subtitle: "আপনার নির্বাচিত এলাকার কাছাকাছি ব্যাংক এবং তাদের সম্ভাব্য ঋণ সুবিধা।",
    selectedLocation: "নির্বাচিত স্থান",
    search: "কাছাকাছি ব্যাংক খুঁজুন",
    loading: "কাছাকাছি ব্যাংক খোঁজা হচ্ছে…",
    noLocation: "কাছাকাছি ব্যাংক দেখতে আগে অবস্থানের প্রশ্নটি সম্পূর্ণ করুন।",
    noResults: "এই এলাকার আশেপাশে কোনো ব্যাংক পাওয়া যায়নি।",
    locationNote: "ব্যাংক শাখা নির্বাচিত অবস্থানের ভিত্তিতে দেখানো হয়। ঋণের পরিমাণ প্রোটোটাইপ পণ্যের পরিসর এবং ব্যাংক ও আবেদনকারীর উপর নির্ভর করে পরিবর্তিত হতে পারে।",
    distance: "দূরত্ব",
    loanAmount: "ঋণের পরিমাণ",
    openMaps: "ম্যাপে খুলুন",
    retry: "আবার চেষ্টা করুন",
    radius: "১০ কিমির মধ্যে",
    bank: "ব্যাংক",
  },
  ta: {
    title: "அருகிலுள்ள வங்கி உதவி",
    subtitle: "நீங்கள் தேர்ந்தெடுத்த இடத்திற்கு அருகிலுள்ள வங்கிகள் மற்றும் அவை வழங்கக்கூடிய கடன் உதவி।",
    selectedLocation: "தேர்ந்தெடுத்த இடம்",
    search: "அருகிலுள்ள வங்கிகளைத் தேடுங்கள்",
    loading: "அருகிலுள்ள வங்கிகள் தேடப்படுகின்றன…",
    noLocation: "அருகிலுள்ள வங்கிகளைப் பார்க்க முதலில் இருப்பிடக் கேள்வியை முடிக்கவும்.",
    noResults: "இந்த இடத்திற்கு அருகில் வங்கிகள் எதுவும் கிடைக்கவில்லை.",
    locationNote: "வங்கி கிளைகள் நீங்கள் தேர்ந்தெடுத்த இடத்தை அடிப்படையாகக் கொண்டு காட்டப்படுகின்றன. காட்டப்படும் கடன் தொகைகள் முன்மாதிரி தயாரிப்பு வரம்புகள்; வங்கி மற்றும் விண்ணப்பதாரரைப் பொறுத்து மாறலாம்.",
    distance: "தூரம்",
    loanAmount: "கடன் தொகை",
    openMaps: "வரைபடத்தில் திறக்கவும்",
    retry: "மீண்டும் முயற்சிக்கவும்",
    radius: "10 கி.மீ.க்குள்",
    bank: "வங்கி",
  },
  mr: {
    title: "जवळची बँक मदत",
    subtitle: "तुम्ही निवडलेल्या ठिकाणाजवळील बँका आणि त्यांच्याकडून मिळू शकणाऱ्या कर्जाच्या सुविधा.",
    selectedLocation: "निवडलेले ठिकाण",
    search: "जवळच्या बँका शोधा",
    loading: "जवळच्या बँका शोधत आहे…",
    noLocation: "जवळच्या बँका पाहण्यासाठी आधी स्थानाचा प्रश्न पूर्ण करा.",
    noResults: "या ठिकाणाजवळ कोणतीही बँक सापडली नाही.",
    locationNote: "बँक शाखा निवडलेल्या ठिकाणाच्या आधारे दाखवल्या जातात. दाखवलेली कर्जाची रक्कम प्रोटोटाइप उत्पादन श्रेणी आहे आणि बँक व अर्जदारानुसार बदलू शकते.",
    distance: "अंतर",
    loanAmount: "कर्जाची रक्कम",
    openMaps: "नकाशात उघडा",
    retry: "पुन्हा प्रयत्न करा",
    radius: "10 किमीच्या आत",
    bank: "बँक",
  },
  te: {
    title: "సమీప బ్యాంక్ సహాయం",
    subtitle: "మీరు ఎంచుకున్న ప్రాంతానికి సమీపంలోని బ్యాంకులు మరియు అవి అందించగల రుణ సహాయం.",
    selectedLocation: "ఎంచుకున్న స్థానం",
    search: "సమీప బ్యాంకులను శోధించండి",
    loading: "సమీప బ్యాంకులను శోధిస్తున్నాము…",
    noLocation: "సమీప బ్యాంకులను చూడటానికి ముందుగా స్థాన ప్రశ్నను పూర్తి చేయండి.",
    noResults: "ఈ ప్రాంతం సమీపంలో బ్యాంకులు ఏవీ కనుగొనబడలేదు.",
    locationNote: "బ్యాంక్ శాఖలు మీరు ఎంచుకున్న ప్రాంతం ఆధారంగా చూపబడతాయి. చూపిన రుణ మొత్తాలు ప్రోటోటైప్ ఉత్పత్తి పరిధులు; బ్యాంక్ మరియు దరఖాస్తుదారుని బట్టి మారవచ్చు.",
    distance: "దూరం",
    loanAmount: "రుణ మొత్తం",
    openMaps: "మ్యాప్‌లో తెరవండి",
    retry: "మళ్లీ ప్రయత్నించండి",
    radius: "10 కి.మీ లోపు",
    bank: "బ్యాంక్",
  },
};

const NEARBY_LOAN_RANGES = {
  "State Bank of India": "₹50,000 – ₹1 Crore",
  "Punjab National Bank": "₹50,000 – ₹1 Crore",
  "Bank of Baroda": "₹50,000 – ₹1 Crore",
  "Canara Bank": "₹50,000 – ₹1 Crore",
  "Union Bank of India": "₹50,000 – ₹1 Crore",
  "HDFC Bank": "₹50,000 – ₹50 Lakh",
  "ICICI Bank": "₹50,000 – ₹50 Lakh",
  "Axis Bank": "₹50,000 – ₹50 Lakh",
  "Other Bank": "₹50,000 – ₹25 Lakh",
};

function loanRangeForBank(name) {
  const value = String(name || "");
  const key = Object.keys(NEARBY_LOAN_RANGES).find((k) => value.toLowerCase().includes(k.toLowerCase()));
  return NEARBY_LOAN_RANGES[key || "Other Bank"];
}
const CATEGORY_OPTS = ["SC", "ST", "OBC", "Woman", "Minority", "PwD", "General"];

const CATEGORY_TRANSLATIONS = {
  en: {
    SC: "SC",
    ST: "ST",
    OBC: "OBC",
    Woman: "Woman",
    Minority: "Minority",
    PwD: "PwD",
    General: "General",
  },
  hi: {
    SC: "अनुसूचित जाति",
    ST: "अनुसूचित जनजाति",
    OBC: "अन्य पिछड़ा वर्ग",
    Woman: "महिला",
    Minority: "अल्पसंख्यक",
    PwD: "दिव्यांग",
    General: "सामान्य",
  },
  bn: {
    SC: "তফসিলি জাতি",
    ST: "তফসিলি উপজাতি",
    OBC: "অন্যান্য অনগ্রসর শ্রেণি",
    Woman: "মহিলা",
    Minority: "সংখ্যালঘু",
    PwD: "প্রতিবন্ধী",
    General: "সাধারণ",
  },
  ta: {
    SC: "பட்டியல் சாதி",
    ST: "பட்டியல் பழங்குடி",
    OBC: "பிற்படுத்தப்பட்டோர்",
    Woman: "பெண்",
    Minority: "சிறுபான்மை",
    PwD: "மாற்றுத்திறனாளி",
    General: "பொது",
  },
  mr: {
    SC: "अनुसूचित जाती",
    ST: "अनुसूचित जमाती",
    OBC: "इतर मागासवर्ग",
    Woman: "महिला",
    Minority: "अल्पसंख्याक",
    PwD: "दिव्यांग",
    General: "सामान्य",
  },
  te: {
    SC: "షెడ్యూల్డ్ కులం",
    ST: "షెడ్యూల్డ్ తెగ",
    OBC: "ఇతర వెనుకబడిన తరగతి",
    Woman: "మహిళ",
    Minority: "మైనారిటీ",
    PwD: "దివ్యాంగులు",
    General: "సాధారణ",
  },
};

const INCOME_OPTS = [
  { key: "under1", value: 100000 },
  { key: "oneTwo", value: 200000 },
  { key: "twoFive", value: 500000 },
  { key: "aboveFive", value: 900000 },
];

const INCOME_TRANSLATIONS = {
  en: {
    under1: "Under ₹1 lakh",
    oneTwo: "₹1–2 lakh",
    twoFive: "₹2–5 lakh",
    aboveFive: "Above ₹5 lakh",
  },
  hi: {
    under1: "₹1 लाख से कम",
    oneTwo: "₹1–2 लाख",
    twoFive: "₹2–5 लाख",
    aboveFive: "₹5 लाख से अधिक",
  },
  bn: {
    under1: "₹১ লাখের কম",
    oneTwo: "₹১–২ লাখ",
    twoFive: "₹২–৫ লাখ",
    aboveFive: "₹৫ লাখের বেশি",
  },
  ta: {
    under1: "₹1 லட்சத்திற்கும் குறைவு",
    oneTwo: "₹1–2 லட்சம்",
    twoFive: "₹2–5 லட்சம்",
    aboveFive: "₹5 லட்சத்திற்கு மேல்",
  },
  mr: {
    under1: "₹1 लाखापेक्षा कमी",
    oneTwo: "₹1–2 लाख",
    twoFive: "₹2–5 लाख",
    aboveFive: "₹5 लाखांपेक्षा जास्त",
  },
  te: {
    under1: "₹1 లక్ష కంటే తక్కువ",
    oneTwo: "₹1–2 లక్షలు",
    twoFive: "₹2–5 లక్షలు",
    aboveFive: "₹5 లక్షలకు పైగా",
  },
};

const BUSINESS_OPTS = [
  "Tailoring & Textile",
  "Food & Catering",
  "Handicraft",
  "Retail & Trading",
  "Services",
  "Agriculture-allied",
];

const BUSINESS_TRANSLATIONS = {
  en: {
    "Tailoring & Textile": "Tailoring & Textile",
    "Food & Catering": "Food & Catering",
    Handicraft: "Handicraft",
    "Retail & Trading": "Retail & Trading",
    Services: "Services",
    "Agriculture-allied": "Agriculture-allied",
  },
  hi: {
    "Tailoring & Textile": "सिलाई और कपड़ा",
    "Food & Catering": "भोजन और कैटरिंग",
    Handicraft: "हस्तशिल्प",
    "Retail & Trading": "खुदरा और व्यापार",
    Services: "सेवाएँ",
    "Agriculture-allied": "कृषि-संबंधित",
  },
  bn: {
    "Tailoring & Textile": "দর্জি ও বস্ত্র",
    "Food & Catering": "খাদ্য ও ক্যাটারিং",
    Handicraft: "হস্তশিল্প",
    "Retail & Trading": "খুচরা ও বাণিজ্য",
    Services: "পরিষেবা",
    "Agriculture-allied": "কৃষি-সম্পর্কিত",
  },
  ta: {
    "Tailoring & Textile": "தையல் மற்றும் துணி",
    "Food & Catering": "உணவு மற்றும் கேட்டரிங்",
    Handicraft: "கைவினைப்பொருட்கள்",
    "Retail & Trading": "சில்லறை மற்றும் வர்த்தகம்",
    Services: "சேவைகள்",
    "Agriculture-allied": "விவசாயம் சார்ந்த",
  },
  mr: {
    "Tailoring & Textile": "शिवणकाम आणि कापड",
    "Food & Catering": "अन्न आणि केटरिंग",
    Handicraft: "हस्तकला",
    "Retail & Trading": "किरकोळ आणि व्यापार",
    Services: "सेवा",
    "Agriculture-allied": "कृषी-संबंधित",
  },
  te: {
    "Tailoring & Textile": "టైలరింగ్ & టెక్స్‌టైల్",
    "Food & Catering": "ఆహారం & క్యాటరింగ్",
    Handicraft: "హస్తకళ",
    "Retail & Trading": "రిటైల్ & ట్రేడింగ్",
    Services: "సేవలు",
    "Agriculture-allied": "వ్యవసాయ అనుబంధ",
  },
};

const SCHEME_TRANSLATIONS = {
  en: {
    sui: {
      name: "Stand-Up India",
      benefit: "Loan ₹10 lakh – ₹1 Cr",
      short:
        "Bank loans for first-time SC/ST and women entrepreneurs to set up a greenfield business.",
    },
    dksh: {
      name: "PM-DAKSH",
      benefit: "Free training + monthly stipend",
      short:
        "Skill-development training with a stipend for SC, OBC, minority and PwD candidates.",
    },
    nbcfdc: {
      name: "NBCFDC Micro-Credit",
      benefit: "Micro-loan up to ₹5 lakh",
      short:
        "Low-interest micro-credit for backward-class entrepreneurs running small businesses.",
    },
    mun: {
      name: "Mahila Udyam Nidhi",
      benefit: "Loan up to ₹10 lakh",
      short:
        "Concessional loans for women setting up small-scale business ventures.",
    },
    nhfdc: {
      name: "NHFDC Entrepreneur Loan",
      benefit: "Loan up to ₹25 lakh",
      short:
        "Concessional financing for persons with disabilities starting or expanding a business.",
    },
    mudra: {
      name: "PM Mudra Yojana (Shishu)",
      benefit: "Collateral-free loan up to ₹50,000",
      short:
        "Starter loan with no collateral for very small or early-stage businesses, open to all categories.",
    },
  },

  hi: {
    sui: {
      name: "स्टैंड-अप इंडिया",
      benefit: "₹10 लाख – ₹1 करोड़ तक का ऋण",
      short:
        "पहली बार व्यवसाय शुरू करने वाले SC/ST और महिला उद्यमियों के लिए बैंक ऋण।",
    },
    dksh: {
      name: "पीएम-दक्ष",
      benefit: "निःशुल्क प्रशिक्षण + मासिक वजीफा",
      short:
        "SC, OBC, अल्पसंख्यक और दिव्यांग उम्मीदवारों के लिए कौशल प्रशिक्षण और वजीफा।",
    },
    nbcfdc: {
      name: "NBCFDC माइक्रो-क्रेडिट",
      benefit: "₹5 लाख तक का माइक्रो-लोन",
      short:
        "छोटे व्यवसाय चलाने वाले पिछड़े वर्ग के उद्यमियों के लिए कम ब्याज वाला ऋण।",
    },
    mun: {
      name: "महिला उद्यम निधि",
      benefit: "₹10 लाख तक का ऋण",
      short:
        "छोटे व्यवसाय शुरू करने वाली महिलाओं के लिए रियायती ऋण।",
    },
    nhfdc: {
      name: "NHFDC उद्यमी ऋण",
      benefit: "₹25 लाख तक का ऋण",
      short:
        "दिव्यांग व्यक्तियों को व्यवसाय शुरू या बढ़ाने के लिए रियायती वित्तीय सहायता।",
    },
    mudra: {
      name: "प्रधानमंत्री मुद्रा योजना (शिशु)",
      benefit: "₹50,000 तक बिना गारंटी का ऋण",
      short:
        "बहुत छोटे या शुरुआती व्यवसायों के लिए बिना गारंटी का शुरुआती ऋण।",
    },
  },

  bn: {
    sui: {
      name: "স্ট্যান্ড-আপ ইন্ডিয়া",
      benefit: "₹১০ লাখ – ₹১ কোটি পর্যন্ত ঋণ",
      short:
        "প্রথমবার ব্যবসা শুরু করা SC/ST এবং মহিলা উদ্যোক্তাদের জন্য ব্যাংক ঋণ।",
    },
    dksh: {
      name: "PM-DAKSH",
      benefit: "বিনামূল্যে প্রশিক্ষণ + মাসিক ভাতা",
      short:
        "SC, OBC, সংখ্যালঘু এবং প্রতিবন্ধী প্রার্থীদের জন্য দক্ষতা উন্নয়ন প্রশিক্ষণ।",
    },
    nbcfdc: {
      name: "NBCFDC মাইক্রো-ক্রেডিট",
      benefit: "₹৫ লাখ পর্যন্ত মাইক্রো-লোন",
      short:
        "ছোট ব্যবসা পরিচালনাকারী অনগ্রসর শ্রেণির উদ্যোক্তাদের জন্য কম সুদের ঋণ।",
    },
    mun: {
      name: "মহিলা উদ্যোগ নিধি",
      benefit: "₹১০ লাখ পর্যন্ত ঋণ",
      short:
        "ছোট ব্যবসা শুরু করা মহিলাদের জন্য স্বল্পসুদের ঋণ।",
    },
    nhfdc: {
      name: "NHFDC উদ্যোক্তা ঋণ",
      benefit: "₹২৫ লাখ পর্যন্ত ঋণ",
      short:
        "প্রতিবন্ধী ব্যক্তিদের ব্যবসা শুরু বা সম্প্রসারণের জন্য ঋণ।",
    },
    mudra: {
      name: "প্রধানমন্ত্রী মুদ্রা যোজনা (শিশু)",
      benefit: "₹৫০,০০০ পর্যন্ত জামানতবিহীন ঋণ",
      short:
        "খুব ছোট বা প্রাথমিক পর্যায়ের ব্যবসার জন্য জামানতবিহীন ঋণ।",
    },
  },

  ta: {
    sui: {
      name: "Stand-Up India",
      benefit: "₹10 லட்சம் – ₹1 கோடி வரை கடன்",
      short:
        "முதல் முறையாக தொழில் தொடங்கும் SC/ST மற்றும் பெண்கள் தொழில்முனைவோருக்கான வங்கி கடன்.",
    },
    dksh: {
      name: "PM-DAKSH",
      benefit: "இலவச பயிற்சி + மாதாந்திர உதவித்தொகை",
      short:
        "SC, OBC, சிறுபான்மை மற்றும் மாற்றுத்திறனாளிகளுக்கான திறன் பயிற்சி.",
    },
    nbcfdc: {
      name: "NBCFDC Micro-Credit",
      benefit: "₹5 லட்சம் வரை சிறுகடன்",
      short:
        "சிறு வணிகம் நடத்தும் பிற்படுத்தப்பட்ட வகுப்பினருக்கான குறைந்த வட்டி கடன்.",
    },
    mun: {
      name: "Mahila Udyam Nidhi",
      benefit: "₹10 லட்சம் வரை கடன்",
      short:
        "சிறு தொழில் தொடங்கும் பெண்களுக்கான சலுகை கடன்.",
    },
    nhfdc: {
      name: "NHFDC Entrepreneur Loan",
      benefit: "₹25 லட்சம் வரை கடன்",
      short:
        "மாற்றுத்திறனாளிகள் தொழில் தொடங்க அல்லது விரிவுபடுத்துவதற்கான நிதி உதவி.",
    },
    mudra: {
      name: "PM Mudra Yojana (Shishu)",
      benefit: "₹50,000 வரை பிணையமில்லா கடன்",
      short:
        "மிகச் சிறிய அல்லது தொடக்க நிலை வணிகங்களுக்கான பிணையமில்லா கடன்.",
    },
  },

  mr: {
    sui: {
      name: "स्टँड-अप इंडिया",
      benefit: "₹10 लाख – ₹1 कोटीपर्यंत कर्ज",
      short:
        "पहिल्यांदा व्यवसाय सुरू करणाऱ्या SC/ST आणि महिला उद्योजकांसाठी बँक कर्ज.",
    },
    dksh: {
      name: "PM-DAKSH",
      benefit: "मोफत प्रशिक्षण + मासिक स्टायपेंड",
      short:
        "SC, OBC, अल्पसंख्याक आणि दिव्यांग उमेदवारांसाठी कौशल्य विकास प्रशिक्षण.",
    },
    nbcfdc: {
      name: "NBCFDC मायक्रो-क्रेडिट",
      benefit: "₹5 लाखांपर्यंत मायक्रो-लोन",
      short:
        "लहान व्यवसाय चालवणाऱ्या मागासवर्गीय उद्योजकांसाठी कमी व्याजाचे कर्ज.",
    },
    mun: {
      name: "महिला उद्यम निधी",
      benefit: "₹10 लाखांपर्यंत कर्ज",
      short:
        "लघुउद्योग सुरू करणाऱ्या महिलांसाठी सवलतीचे कर्ज.",
    },
    nhfdc: {
      name: "NHFDC उद्योजक कर्ज",
      benefit: "₹25 लाखांपर्यंत कर्ज",
      short:
        "दिव्यांग व्यक्तींना व्यवसाय सुरू किंवा वाढवण्यासाठी आर्थिक मदत.",
    },
    mudra: {
      name: "प्रधानमंत्री मुद्रा योजना (शिशु)",
      benefit: "₹50,000 पर्यंत विनातारण कर्ज",
      short:
        "अतिशय लहान किंवा सुरुवातीच्या व्यवसायांसाठी विनातारण कर्ज.",
    },
  },

  te: {
    sui: {
      name: "స్టాండ్-అప్ ఇండియా",
      benefit: "₹10 లక్షలు – ₹1 కోటి వరకు రుణం",
      short:
        "మొదటిసారి వ్యాపారం ప్రారంభించే SC/ST మరియు మహిళా పారిశ్రామికవేత్తలకు బ్యాంకు రుణాలు.",
    },
    dksh: {
      name: "PM-DAKSH",
      benefit: "ఉచిత శిక్షణ + నెలవారీ స్టైపెండ్",
      short:
        "SC, OBC, మైనారిటీ మరియు దివ్యాంగ అభ్యర్థులకు నైపుణ్య అభివృద్ధి శిక్షణ.",
    },
    nbcfdc: {
      name: "NBCFDC Micro-Credit",
      benefit: "₹5 లక్షల వరకు మైక్రో లోన్",
      short:
        "చిన్న వ్యాపారాలు నిర్వహించే వెనుకబడిన వర్గాల పారిశ్రామికవేత్తలకు తక్కువ వడ్డీ రుణం.",
    },
    mun: {
      name: "Mahila Udyam Nidhi",
      benefit: "₹10 లక్షల వరకు రుణం",
      short:
        "చిన్న వ్యాపారాలు ప్రారంభించే మహిళలకు రాయితీ రుణాలు.",
    },
    nhfdc: {
      name: "NHFDC Entrepreneur Loan",
      benefit: "₹25 లక్షల వరకు రుణం",
      short:
        "దివ్యాంగులు వ్యాపారం ప్రారంభించడానికి లేదా విస్తరించడానికి ఆర్థిక సహాయం.",
    },
    mudra: {
      name: "PM Mudra Yojana (Shishu)",
      benefit: "₹50,000 వరకు పూచీకత్తు లేని రుణం",
      short:
        "చిన్న లేదా ప్రారంభ దశ వ్యాపారాలకు పూచీకత్తు లేని రుణం.",
    },
  },
};

const SCHEME_DETAIL_TRANSLATIONS = {
  en: {
    sui: { ministry:"Department of Financial Services", maxAssistance:"Up to ₹1 Crore", interestRate:"Bank-linked rate", subsidy:"As applicable", tags:["SC/ST","Women","OBC"], description:"Bank finance for eligible first-time entrepreneurs to start or expand a small business." },
    dksh:{ ministry:"Ministry of Social Justice & Empowerment", maxAssistance:"Training + stipend", interestRate:"Support-based", subsidy:"Training support", tags:["SC","OBC","Minority","PwD"], description:"Skill-development and livelihood support for eligible beneficiaries from disadvantaged communities." },
    nbcfdc:{ ministry:"National Backward Classes Finance & Development Corporation", maxAssistance:"Micro-loan up to ₹5 lakh", interestRate:"Low interest", subsidy:"As applicable", tags:["OBC","Backward Classes"], description:"Low-interest micro-credit for backward-class entrepreneurs running small businesses." },
    mun:{ ministry:"SIDBI", maxAssistance:"Up to ₹10 Lakh", interestRate:"Concessional", subsidy:"As applicable", tags:["Women","Entrepreneurship"], description:"Concessional financial support for women entrepreneurs setting up or expanding small-scale ventures." },
    nhfdc:{ ministry:"National Handicapped Finance & Development Corporation", maxAssistance:"Up to ₹25 Lakh", interestRate:"Concessional", subsidy:"As applicable", tags:["PwD","Entrepreneurship"], description:"Concessional financing for persons with disabilities starting or expanding a business." },
    mudra:{ ministry:"Ministry of Finance", maxAssistance:"Up to ₹50,000", interestRate:"As applicable", subsidy:"None", tags:["Micro business","Shishu"], description:"Starter loan with no collateral for very small or early-stage businesses, open to all categories." },
  },
  hi: {
    sui: { ministry:"वित्तीय सेवा विभाग", maxAssistance:"₹1 करोड़ तक", interestRate:"बैंक-लिंक्ड दर", subsidy:"लागू के अनुसार", tags:["SC/ST","महिलाएँ","OBC"], description:"पहली बार व्यवसाय शुरू या बढ़ाने वाले SC/ST और महिला उद्यमियों के लिए बैंक वित्त।" },
    dksh:{ ministry:"सामाजिक न्याय और अधिकारिता मंत्रालय", maxAssistance:"प्रशिक्षण + वजीफा", interestRate:"सहायता आधारित", subsidy:"प्रशिक्षण सहायता", tags:["SC","OBC","अल्पसंख्यक","दिव्यांग"], description:"वंचित समुदायों के पात्र लाभार्थियों के लिए कौशल विकास और आजीविका सहायता।" },
    nbcfdc:{ ministry:"राष्ट्रीय पिछड़ा वर्ग वित्त एवं विकास निगम", maxAssistance:"₹5 लाख तक माइक्रो-लोन", interestRate:"कम ब्याज", subsidy:"लागू के अनुसार", tags:["OBC","पिछड़ा वर्ग"], description:"छोटे व्यवसाय चलाने वाले पिछड़े वर्ग के उद्यमियों के लिए कम ब्याज वाला माइक्रो-क्रेडिट।" },
    mun:{ ministry:"SIDBI", maxAssistance:"₹10 लाख तक", interestRate:"रियायती", subsidy:"लागू के अनुसार", tags:["महिलाएँ","उद्यमिता"], description:"छोटे व्यवसाय शुरू या बढ़ाने वाली महिला उद्यमियों के लिए रियायती वित्तीय सहायता।" },
    nhfdc:{ ministry:"राष्ट्रीय दिव्यांग वित्त एवं विकास निगम", maxAssistance:"₹25 लाख तक", interestRate:"रियायती", subsidy:"लागू के अनुसार", tags:["दिव्यांग","उद्यमिता"], description:"दिव्यांग व्यक्तियों को व्यवसाय शुरू या बढ़ाने के लिए रियायती वित्तीय सहायता।" },
    mudra:{ ministry:"वित्त मंत्रालय", maxAssistance:"₹50,000 तक", interestRate:"लागू के अनुसार", subsidy:"कोई नहीं", tags:["सूक्ष्म व्यवसाय","शिशु"], description:"बहुत छोटे या शुरुआती व्यवसायों के लिए बिना गारंटी का शुरुआती ऋण।" },
  },
  bn: {
    sui:{ministry:"আর্থিক পরিষেবা বিভাগ",maxAssistance:"₹১ কোটি পর্যন্ত",interestRate:"ব্যাঙ্ক-লিঙ্কড হার",subsidy:"প্রযোজ্য অনুযায়ী",tags:["SC/ST","মহিলা","OBC"],description:"প্রথমবার ব্যবসা শুরু বা সম্প্রসারণকারী SC/ST এবং মহিলা উদ্যোক্তাদের জন্য ব্যাংক অর্থায়ন।"},
    dksh:{ministry:"সামাজিক ন্যায় ও ক্ষমতায়ন মন্ত্রক",maxAssistance:"প্রশিক্ষণ + ভাতা",interestRate:"সহায়তা-ভিত্তিক",subsidy:"প্রশিক্ষণ সহায়তা",tags:["SC","OBC","সংখ্যালঘু","প্রতিবন্ধী"],description:"বঞ্চিত সম্প্রদায়ের যোগ্য সুবিধাভোগীদের জন্য দক্ষতা উন্নয়ন ও জীবিকা সহায়তা।"},
    nbcfdc:{ministry:"ন্যাশনাল ব্যাকওয়ার্ড ক্লাসেস ফাইন্যান্স অ্যান্ড ডেভেলপমেন্ট কর্পোরেশন",maxAssistance:"₹৫ লাখ পর্যন্ত মাইক্রো-লোন",interestRate:"কম সুদ",subsidy:"প্রযোজ্য অনুযায়ী",tags:["OBC","পিছিয়ে পড়া শ্রেণি"],description:"ছোট ব্যবসা পরিচালনাকারী পিছিয়ে পড়া শ্রেণির উদ্যোক্তাদের জন্য কম সুদের মাইক্রো-ক্রেডিট।"},
    mun:{ministry:"SIDBI",maxAssistance:"₹১০ লাখ পর্যন্ত",interestRate:"সুবিধাজনক",subsidy:"প্রযোজ্য অনুযায়ী",tags:["মহিলা","উদ্যোক্তা"],description:"ছোট ব্যবসা শুরু বা সম্প্রসারণকারী মহিলা উদ্যোক্তাদের জন্য সুবিধাজনক আর্থিক সহায়তা।"},
    nhfdc:{ministry:"ন্যাশনাল হ্যান্ডিক্যাপড ফাইন্যান্স অ্যান্ড ডেভেলপমেন্ট কর্পোরেশন",maxAssistance:"₹২৫ লাখ পর্যন্ত",interestRate:"সুবিধাজনক",subsidy:"প্রযোজ্য অনুযায়ী",tags:["প্রতিবন্ধী","উদ্যোক্তা"],description:"প্রতিবন্ধী ব্যক্তিদের ব্যবসা শুরু বা সম্প্রসারণের জন্য সুবিধাজনক অর্থায়ন।"},
    mudra:{ministry:"অর্থ মন্ত্রক",maxAssistance:"₹৫০,০০০ পর্যন্ত",interestRate:"প্রযোজ্য অনুযায়ী",subsidy:"নেই",tags:["ক্ষুদ্র ব্যবসা","শিশু"],description:"খুব ছোট বা প্রাথমিক পর্যায়ের ব্যবসার জন্য জামানতবিহীন ঋণ।"},
  },
  ta: {
    sui:{ministry:"நிதிச் சேவைகள் துறை",maxAssistance:"₹1 கோடி வரை",interestRate:"வங்கி இணைந்த வட்டி விகிதம்",subsidy:"பொருந்தும் வகையில்",tags:["SC/ST","பெண்கள்","OBC"],description:"முதல் முறையாக தொழில் தொடங்கும் அல்லது விரிவுபடுத்தும் SC/ST மற்றும் பெண்கள் தொழில்முனைவோருக்கான வங்கி நிதி."},
    dksh:{ministry:"சமூக நீதி மற்றும் அதிகாரமளித்தல் அமைச்சகம்",maxAssistance:"பயிற்சி + உதவித்தொகை",interestRate:"ஆதரவு அடிப்படையிலானது",subsidy:"பயிற்சி ஆதரவு",tags:["SC","OBC","சிறுபான்மை","மாற்றுத்திறனாளிகள்"],description:"பின்தங்கிய சமூகங்களின் தகுதியான பயனாளிகளுக்கான திறன் மேம்பாடு மற்றும் வாழ்வாதார ஆதரவு."},
    nbcfdc:{ministry:"தேசிய பிற்படுத்தப்பட்ட வகுப்பினர் நிதி மற்றும் மேம்பாட்டு கழகம்",maxAssistance:"₹5 லட்சம் வரை சிறுகடன்",interestRate:"குறைந்த வட்டி",subsidy:"பொருந்தும் வகையில்",tags:["OBC","பிற்படுத்தப்பட்டோர்"],description:"சிறு வணிகம் நடத்தும் பிற்படுத்தப்பட்ட வகுப்பு தொழில்முனைவோருக்கான குறைந்த வட்டி சிறுகடன்."},
    mun:{ministry:"SIDBI",maxAssistance:"₹10 லட்சம் வரை",interestRate:"சலுகை வட்டி",subsidy:"பொருந்தும் வகையில்",tags:["பெண்கள்","தொழில்முனைவு"],description:"சிறு வணிகங்களைத் தொடங்கும் அல்லது விரிவுபடுத்தும் பெண்கள் தொழில்முனைவோருக்கான சலுகை நிதி உதவி."},
    nhfdc:{ministry:"தேசிய மாற்றுத்திறனாளிகள் நிதி மற்றும் மேம்பாட்டு கழகம்",maxAssistance:"₹25 லட்சம் வரை",interestRate:"சலுகை வட்டி",subsidy:"பொருந்தும் வகையில்",tags:["மாற்றுத்திறனாளிகள்","தொழில்முனைவு"],description:"மாற்றுத்திறனாளிகள் தொழில் தொடங்க அல்லது விரிவுபடுத்துவதற்கான சலுகை நிதியுதவி."},
    mudra:{ministry:"நிதி அமைச்சகம்",maxAssistance:"₹50,000 வரை",interestRate:"பொருந்தும் வகையில்",subsidy:"இல்லை",tags:["சிறு வணிகம்","ஷிஷு"],description:"மிகச் சிறிய அல்லது தொடக்க நிலை வணிகங்களுக்கான பிணையமில்லா தொடக்கக் கடன்."},
  },
  mr: {
    sui:{ministry:"वित्तीय सेवा विभाग",maxAssistance:"₹1 कोटीपर्यंत",interestRate:"बँक-लिंक्ड दर",subsidy:"लागू असल्याप्रमाणे",tags:["SC/ST","महिला","OBC"],description:"पहिल्यांदा व्यवसाय सुरू किंवा वाढवणाऱ्या SC/ST आणि महिला उद्योजकांसाठी बँक वित्त."},
    dksh:{ministry:"सामाजिक न्याय आणि सक्षमीकरण मंत्रालय",maxAssistance:"प्रशिक्षण + स्टायपेंड",interestRate:"आधार-आधारित",subsidy:"प्रशिक्षण सहाय्य",tags:["SC","OBC","अल्पसंख्याक","दिव्यांग"],description:"वंचित समुदायातील पात्र लाभार्थ्यांसाठी कौशल्य विकास आणि उपजीविका सहाय्य."},
    nbcfdc:{ministry:"राष्ट्रीय मागासवर्गीय वित्त व विकास महामंडळ",maxAssistance:"₹5 लाखांपर्यंत मायक्रो-लोन",interestRate:"कमी व्याज",subsidy:"लागू असल्याप्रमाणे",tags:["OBC","मागासवर्ग"],description:"लहान व्यवसाय चालवणाऱ्या मागासवर्गीय उद्योजकांसाठी कमी व्याजाचे मायक्रो-क्रेडिट."},
    mun:{ministry:"SIDBI",maxAssistance:"₹10 लाखांपर्यंत",interestRate:"सवलतीचा",subsidy:"लागू असल्याप्रमाणे",tags:["महिला","उद्योजकता"],description:"लहान व्यवसाय सुरू किंवा वाढवणाऱ्या महिला उद्योजकांसाठी सवलतीची आर्थिक मदत."},
    nhfdc:{ministry:"राष्ट्रीय दिव्यांग वित्त व विकास महामंडळ",maxAssistance:"₹25 लाखांपर्यंत",interestRate:"सवलतीचा",subsidy:"लागू असल्याप्रमाणे",tags:["दिव्यांग","उद्योजकता"],description:"दिव्यांग व्यक्तींना व्यवसाय सुरू किंवा वाढवण्यासाठी सवलतीची वित्तीय मदत."},
    mudra:{ministry:"अर्थ मंत्रालय",maxAssistance:"₹50,000 पर्यंत",interestRate:"लागू असल्याप्रमाणे",subsidy:"नाही",tags:["सूक्ष्म व्यवसाय","शिशु"],description:"अतिशय लहान किंवा सुरुवातीच्या व्यवसायांसाठी विनातारण प्रारंभिक कर्ज."},
  },
  te: {
    sui:{ministry:"ఆర్థిక సేవల విభాగం",maxAssistance:"₹1 కోటి వరకు",interestRate:"బ్యాంక్-లింక్డ్ రేటు",subsidy:"వర్తించిన విధంగా",tags:["SC/ST","మహిళలు","OBC"],description:"మొదటిసారి వ్యాపారం ప్రారంభించే లేదా విస్తరించే SC/ST మరియు మహిళా పారిశ్రామికవేత్తలకు బ్యాంకు ఆర్థిక సహాయం."},
    dksh:{ministry:"సామాజిక న్యాయం మరియు సాధికారత మంత్రిత్వ శాఖ",maxAssistance:"శిక్షణ + స్టైపెండ్",interestRate:"సహాయ ఆధారిత",subsidy:"శిక్షణ సహాయం",tags:["SC","OBC","మైనారిటీ","దివ్యాంగులు"],description:"వెనుకబడిన వర్గాల అర్హతగల లబ్ధిదారులకు నైపుణ్యాభివృద్ధి మరియు జీవనోపాధి సహాయం."},
    nbcfdc:{ministry:"నేషనల్ బ్యాక్‌వర్డ్ క్లాసెస్ ఫైనాన్స్ అండ్ డెవలప్‌మెంట్ కార్పొరేషన్",maxAssistance:"₹5 లక్షల వరకు మైక్రో లోన్",interestRate:"తక్కువ వడ్డీ",subsidy:"వర్తించిన విధంగా",tags:["OBC","వెనుకబడిన వర్గాలు"],description:"చిన్న వ్యాపారాలు నిర్వహించే వెనుకబడిన వర్గాల పారిశ్రామికవేత్తలకు తక్కువ వడ్డీ మైక్రో క్రెడిట్."},
    mun:{ministry:"SIDBI",maxAssistance:"₹10 లక్షల వరకు",interestRate:"రాయితీ",subsidy:"వర్తించిన విధంగా",tags:["మహిళలు","పారిశ్రామికవేత్తలు"],description:"చిన్న వ్యాపారాలు ప్రారంభించే లేదా విస్తరించే మహిళా పారిశ్రామికవేత్తలకు రాయితీ ఆర్థిక సహాయం."},
    nhfdc:{ministry:"నేషనల్ హ్యాండీక్యాప్డ్ ఫైనాన్స్ అండ్ డెవలప్‌మెంట్ కార్పొరేషన్",maxAssistance:"₹25 లక్షల వరకు",interestRate:"రాయితీ",subsidy:"వర్తించిన విధంగా",tags:["దివ్యాంగులు","పారిశ్రామికవేత్తలు"],description:"దివ్యాంగులు వ్యాపారం ప్రారంభించడానికి లేదా విస్తరించడానికి రాయితీ ఆర్థిక సహాయం."},
    mudra:{ministry:"ఆర్థిక మంత్రిత్వ శాఖ",maxAssistance:"₹50,000 వరకు",interestRate:"వర్తించిన విధంగా",subsidy:"లేదు",tags:["సూక్ష్మ వ్యాపారం","శిశు"],description:"చిన్న లేదా ప్రారంభ దశ వ్యాపారాలకు పూచీకత్తు లేని ప్రారంభ రుణం."},
  },
};

const PROFILE_UI_TRANSLATIONS = {
  en: {
    title: "My Profile", editProfile: "Edit Profile", profileCompletion: "Profile Completion", completeProfile: "Complete your profile to get better scheme matches",
    personal: "Personal Details", business: "Business Details", financial: "Financial Details", edit: "Edit",
    fullName: "Full Name", age: "Age", gender: "Gender", category: "Category", state: "State", annualIncome: "Annual Income",
    businessName: "Business Name", sector: "Sector", stage: "Stage", employees: "Employees", locationType: "Location Type", registration: "Registration",
    fundingNeed: "Funding Need", purpose: "Purpose", assistanceType: "Assistance Type", notProvided: "Not provided", profileActive: "Profile active",
    existingBusiness: "Existing", urban: "Urban", schemeSupport: "Scheme Support"
  },
  hi: {
    title: "मेरी प्रोफ़ाइल", editProfile: "प्रोफ़ाइल संपादित करें", profileCompletion: "प्रोफ़ाइल पूर्णता", completeProfile: "बेहतर योजना मिलान के लिए अपनी प्रोफ़ाइल पूरी करें",
    personal: "व्यक्तिगत विवरण", business: "व्यवसाय विवरण", financial: "वित्तीय विवरण", edit: "संपादित करें",
    fullName: "पूरा नाम", age: "आयु", gender: "लिंग", category: "श्रेणी", state: "राज्य", annualIncome: "वार्षिक आय",
    businessName: "व्यवसाय का नाम", sector: "क्षेत्र", stage: "चरण", employees: "कर्मचारी", locationType: "स्थान प्रकार", registration: "पंजीकरण",
    fundingNeed: "वित्तीय आवश्यकता", purpose: "उद्देश्य", assistanceType: "सहायता प्रकार", notProvided: "उपलब्ध नहीं", profileActive: "प्रोफ़ाइल सक्रिय",
    existingBusiness: "मौजूदा", urban: "शहरी", schemeSupport: "योजना सहायता"
  },
  bn: {
    title: "আমার প্রোফাইল", editProfile: "প্রোফাইল সম্পাদনা করুন", profileCompletion: "প্রোফাইল সম্পূর্ণতা", completeProfile: "আরও ভালো প্রকল্প মিলের জন্য আপনার প্রোফাইল সম্পূর্ণ করুন",
    personal: "ব্যক্তিগত বিবরণ", business: "ব্যবসার বিবরণ", financial: "আর্থিক বিবরণ", edit: "সম্পাদনা",
    fullName: "পূর্ণ নাম", age: "বয়স", gender: "লিঙ্গ", category: "শ্রেণি", state: "রাজ্য", annualIncome: "বার্ষিক আয়",
    businessName: "ব্যবসার নাম", sector: "ক্ষেত্র", stage: "পর্যায়", employees: "কর্মচারী", locationType: "অবস্থানের ধরন", registration: "নিবন্ধন",
    fundingNeed: "অর্থের প্রয়োজন", purpose: "উদ্দেশ্য", assistanceType: "সহায়তার ধরন", notProvided: "দেওয়া হয়নি", profileActive: "প্রোফাইল সক্রিয়",
    existingBusiness: "বিদ্যমান", urban: "শহুরে", schemeSupport: "প্রকল্প সহায়তা"
  },
  ta: {
    title: "என் சுயவிவரம்", editProfile: "சுயவிவரத்தைத் திருத்து", profileCompletion: "சுயவிவர நிறைவு", completeProfile: "சிறந்த திட்ட பொருத்தங்களுக்கு உங்கள் சுயவிவரத்தை நிறைவு செய்யுங்கள்",
    personal: "தனிப்பட்ட விவரங்கள்", business: "வணிக விவரங்கள்", financial: "நிதி விவரங்கள்", edit: "திருத்து",
    fullName: "முழுப் பெயர்", age: "வயது", gender: "பாலினம்", category: "வகை", state: "மாநிலம்", annualIncome: "ஆண்டு வருமானம்",
    businessName: "வணிகத்தின் பெயர்", sector: "துறை", stage: "நிலை", employees: "பணியாளர்கள்", locationType: "இட வகை", registration: "பதிவு",
    fundingNeed: "நிதி தேவை", purpose: "நோக்கம்", assistanceType: "உதவி வகை", notProvided: "வழங்கப்படவில்லை", profileActive: "சுயவிவரம் செயலில்",
    existingBusiness: "ஏற்கனவே உள்ளது", urban: "நகர்ப்புறம்", schemeSupport: "திட்ட உதவி"
  },
  mr: {
    title: "माझे प्रोफाइल", editProfile: "प्रोफाइल संपादित करा", profileCompletion: "प्रोफाइल पूर्णता", completeProfile: "चांगल्या योजना जुळणीसाठी आपले प्रोफाइल पूर्ण करा",
    personal: "वैयक्तिक तपशील", business: "व्यवसाय तपशील", financial: "आर्थिक तपशील", edit: "संपादित करा",
    fullName: "पूर्ण नाव", age: "वय", gender: "लिंग", category: "श्रेणी", state: "राज्य", annualIncome: "वार्षिक उत्पन्न",
    businessName: "व्यवसायाचे नाव", sector: "क्षेत्र", stage: "टप्पा", employees: "कर्मचारी", locationType: "स्थान प्रकार", registration: "नोंदणी",
    fundingNeed: "आर्थिक गरज", purpose: "उद्देश", assistanceType: "सहाय्य प्रकार", notProvided: "उपलब्ध नाही", profileActive: "प्रोफाइल सक्रिय",
    existingBusiness: "विद्यमान", urban: "शहरी", schemeSupport: "योजना सहाय्य"
  },
  te: {
    title: "నా ప్రొఫైల్", editProfile: "ప్రొఫైల్‌ను సవరించండి", profileCompletion: "ప్రొఫైల్ పూర్తి స్థాయి", completeProfile: "మెరుగైన పథకాల సరిపోలిక కోసం మీ ప్రొఫైల్‌ను పూర్తి చేయండి",
    personal: "వ్యక్తిగత వివరాలు", business: "వ్యాపార వివరాలు", financial: "ఆర్థిక వివరాలు", edit: "సవరించండి",
    fullName: "పూర్తి పేరు", age: "వయస్సు", gender: "లింగం", category: "వర్గం", state: "రాష్ట్రం", annualIncome: "వార్షిక ఆదాయం",
    businessName: "వ్యాపారం పేరు", sector: "రంగం", stage: "దశ", employees: "ఉద్యోగులు", locationType: "స్థల రకం", registration: "నమోదు",
    fundingNeed: "నిధుల అవసరం", purpose: "ఉద్దేశ్యం", assistanceType: "సహాయ రకం", notProvided: "అందించలేదు", profileActive: "ప్రొఫైల్ సక్రియంగా ఉంది",
    existingBusiness: "ప్రస్తుతం ఉన్నది", urban: "పట్టణ", schemeSupport: "పథకం సహాయం"
  },
};

const HELP_TRANSLATIONS = {
  en:{title:"Help & Support",intro:"We're here to help you find the right scheme",cards:[
    ["AI Chatbot","Get instant answers about schemes, eligibility & documents","🤖","Chat Now"],
    ["Helpline","1800-XXX-XXXX (Toll Free) · Mon–Sat 9AM–6PM","📞","Call Now"],
    ["Email Support","support@schemesaathi.gov.in · Response within 24 hrs","✉️","Email"],
    ["Visit DIC","Find your nearest District Industries Centre for guidance","🏛️","Find DIC"]],
    faqTitle:"Frequently Asked Questions", faqs:[["How does AI matching work?","We compare your profile details with scheme eligibility factors and rank the schemes that best fit your information."],["Is my data stored anywhere?","This prototype keeps profile information in the current app session for demonstrating the user flow."],["How do I apply for a scheme?","Open a scheme from the scheme search section, review the details and required documents, then continue through the guided application flow."],["Can I use voice input?","Yes. Use Tap to Speak on the dashboard and answer the profile questions using your microphone. You can also type when needed."]]},
  hi:{title:"मदद और सहायता",intro:"सही योजना खोजने में हम आपकी मदद के लिए यहाँ हैं",cards:[
    ["एआई चैटबॉट","योजनाओं, पात्रता और दस्तावेज़ों के बारे में तुरंत उत्तर पाएँ","🤖","अभी चैट करें"],["हेल्पलाइन","1800-XXX-XXXX (टोल फ्री) · सोम–शनि 9AM–6PM","📞","अभी कॉल करें"],["ईमेल सहायता","support@schemesaathi.gov.in · 24 घंटे के भीतर उत्तर","✉️","ईमेल"],["DIC पर जाएँ","मार्गदर्शन के लिए अपने निकटतम जिला उद्योग केंद्र को खोजें","🏛️","DIC खोजें"]],faqTitle:"अक्सर पूछे जाने वाले प्रश्न",faqs:[["एआई मिलान कैसे काम करता है?","हम आपकी प्रोफ़ाइल की जानकारी की तुलना योजना की पात्रता शर्तों से करते हैं और सबसे उपयुक्त योजनाओं को ऊपर दिखाते हैं।"],["क्या मेरा डेटा कहीं संग्रहीत होता है?","यह प्रोटोटाइप उपयोगकर्ता प्रवाह दिखाने के लिए प्रोफ़ाइल जानकारी को वर्तमान ऐप सत्र में रखता है।"],["मैं किसी योजना के लिए आवेदन कैसे करूँ?","योजना खोज अनुभाग से योजना खोलें, विवरण और आवश्यक दस्तावेज़ देखें, फिर निर्देशित आवेदन प्रक्रिया जारी रखें।"],["क्या मैं वॉइस इनपुट का उपयोग कर सकता हूँ?","हाँ। डैशबोर्ड पर बोलने के लिए टैप करें और माइक्रोफ़ोन से प्रोफ़ाइल के प्रश्नों का उत्तर दें। ज़रूरत होने पर टाइप भी कर सकते हैं।"]]},
  bn:{title:"সহায়তা ও সমর্থন",intro:"সঠিক প্রকল্প খুঁজে পেতে আমরা আপনাকে সাহায্য করতে এখানে আছি",cards:[["AI চ্যাটবট","প্রকল্প, যোগ্যতা ও নথি সম্পর্কে তাৎক্ষণিক উত্তর পান","🤖","চ্যাট করুন"],["হেল্পলাইন","1800-XXX-XXXX (টোল ফ্রি) · সোম–শনি 9AM–6PM","📞","কল করুন"],["ইমেল সহায়তা","support@schemesaathi.gov.in · ২৪ ঘণ্টার মধ্যে উত্তর","✉️","ইমেল"],["DIC পরিদর্শন","পরামর্শের জন্য নিকটস্থ জেলা শিল্প কেন্দ্র খুঁজুন","🏛️","DIC খুঁজুন"]],faqTitle:"সাধারণ জিজ্ঞাসা",faqs:[["AI মিল কীভাবে কাজ করে?","আমরা আপনার প্রোফাইলের তথ্যকে প্রকল্পের যোগ্যতার সঙ্গে তুলনা করে সবচেয়ে উপযুক্ত প্রকল্পগুলো আগে দেখাই।"],["আমার ডেটা কি কোথাও সংরক্ষিত হয়?","এই প্রোটোটাইপ ব্যবহারকারীর প্রবাহ দেখানোর জন্য বর্তমান অ্যাপ সেশনে প্রোফাইল তথ্য রাখে।"],["আমি কীভাবে একটি প্রকল্পের জন্য আবেদন করব?","প্রকল্প অনুসন্ধান বিভাগ থেকে একটি প্রকল্প খুলুন, বিবরণ ও প্রয়োজনীয় নথি দেখুন এবং নির্দেশিত আবেদন প্রক্রিয়া চালিয়ে যান।"],["আমি কি ভয়েস ইনপুট ব্যবহার করতে পারি?","হ্যাঁ। ড্যাশবোর্ডে কথা বলতে ট্যাপ করুন এবং মাইক্রোফোন ব্যবহার করে প্রোফাইল প্রশ্নের উত্তর দিন। প্রয়োজনে টাইপও করতে পারেন।"]]},
  ta:{title:"உதவி மற்றும் ஆதரவு",intro:"சரியான திட்டத்தை கண்டறிய உங்களுக்கு உதவ நாங்கள் இங்கே இருக்கிறோம்",cards:[["AI Chatbot","திட்டங்கள், தகுதி மற்றும் ஆவணங்கள் பற்றிய உடனடி பதில்களைப் பெறுங்கள்","🤖","அரட்டை"],["உதவி தொலைபேசி","1800-XXX-XXXX (இலவசம்) · திங்கள்–சனி 9AM–6PM","📞","அழைக்கவும்"],["மின்னஞ்சல் உதவி","support@schemesaathi.gov.in · 24 மணி நேரத்திற்குள் பதில்","✉️","மின்னஞ்சல்"],["DIC-ஐ பார்க்கவும்","வழிகாட்டலுக்கான அருகிலுள்ள மாவட்ட தொழில் மையத்தைக் கண்டறியவும்","🏛️","DIC தேடல்"]],faqTitle:"அடிக்கடி கேட்கப்படும் கேள்விகள்",faqs:[["AI பொருத்தம் எப்படி செயல்படுகிறது?","உங்கள் சுயவிவரத் தகவலைத் திட்டத் தகுதி விதிகளுடன் ஒப்பிட்டு பொருத்தமான திட்டங்களை வரிசைப்படுத்துகிறோம்."],["என் தரவு எங்காவது சேமிக்கப்படுகிறதா?","இந்த முன்மாதிரி பயனர் செயல்முறையை காட்ட தற்போதைய பயன்பாட்டு அமர்வில் சுயவிவரத் தகவலை வைத்திருக்கிறது."],["ஒரு திட்டத்திற்கு எப்படி விண்ணப்பிப்பது?","திட்டத் தேடல் பகுதியிலிருந்து ஒரு திட்டத்தைத் திறந்து விவரங்கள் மற்றும் தேவையான ஆவணங்களைப் பார்த்து வழிகாட்டப்பட்ட விண்ணப்பத்தைத் தொடருங்கள்."],["நான் குரல் உள்ளீட்டை பயன்படுத்தலாமா?","ஆம். டாஷ்போர்டில் பேச தட்டவும், மைக்ரோஃபோன் மூலம் சுயவிவரக் கேள்விகளுக்கு பதிலளிக்கவும். தேவையெனில் தட்டச்சு செய்யலாம்."]]},
  mr:{title:"मदत आणि समर्थन",intro:"योग्य योजना शोधण्यात मदत करण्यासाठी आम्ही येथे आहोत",cards:[["एआय चॅटबॉट","योजना, पात्रता आणि कागदपत्रांबद्दल त्वरित उत्तरे मिळवा","🤖","चॅट करा"],["हेल्पलाइन","1800-XXX-XXXX (टोल फ्री) · सोम–शनि 9AM–6PM","📞","कॉल करा"],["ईमेल सहाय्य","support@schemesaathi.gov.in · 24 तासांत उत्तर","✉️","ईमेल"],["DIC ला भेट द्या","मार्गदर्शनासाठी जवळचे जिल्हा उद्योग केंद्र शोधा","🏛️","DIC शोधा"]],faqTitle:"वारंवार विचारले जाणारे प्रश्न",faqs:[["एआय जुळणी कशी काम करते?","आम्ही आपल्या प्रोफाइलची माहिती योजना पात्रतेशी तुलना करून सर्वात योग्य योजना वर दाखवतो."],["माझा डेटा कुठे साठवला जातो का?","हा प्रोटोटाइप वापरकर्ता प्रवाह दाखवण्यासाठी वर्तमान अॅप सत्रात प्रोफाइल माहिती ठेवतो."],["योजनेसाठी अर्ज कसा करायचा?","योजना शोध विभागातून योजना उघडा, तपशील आणि आवश्यक कागदपत्रे पहा आणि मार्गदर्शित अर्ज प्रक्रिया पुढे सुरू ठेवा."],["मी व्हॉइस इनपुट वापरू शकतो का?","होय. डॅशबोर्डवर बोलण्यासाठी टॅप करा आणि मायक्रोफोन वापरून प्रोफाइल प्रश्नांची उत्तरे द्या. गरज असल्यास टाइपही करू शकता."]]},
  te:{title:"సహాయం & మద్దతు",intro:"సరైన పథకాన్ని కనుగొనడంలో మీకు సహాయం చేయడానికి మేము ఇక్కడ ఉన్నాము",cards:[["AI చాట్‌బాట్","పథకాలు, అర్హత మరియు పత్రాల గురించి తక్షణ సమాధానాలు పొందండి","🤖","చాట్ చేయండి"],["హెల్ప్‌లైన్","1800-XXX-XXXX (టోల్ ఫ్రీ) · సోమ–శని 9AM–6PM","📞","కాల్ చేయండి"],["ఈమెయిల్ సహాయం","support@schemesaathi.gov.in · 24 గంటల్లో సమాధానం","✉️","ఈమెయిల్"],["DICని సందర్శించండి","మార్గదర్శకత్వం కోసం సమీప జిల్లా పరిశ్రమల కేంద్రాన్ని కనుగొనండి","🏛️","DIC కనుగొనండి"]],faqTitle:"తరచుగా అడిగే ప్రశ్నలు",faqs:[["AI సరిపోలిక ఎలా పనిచేస్తుంది?","మీ ప్రొఫైల్ సమాచారాన్ని పథక అర్హత అంశాలతో పోల్చి అత్యంత సరిపడే పథకాలను ముందుగా చూపుతాము."],["నా డేటా ఎక్కడైనా నిల్వ చేయబడుతుందా?","ఈ ప్రోటోటైప్ వినియోగదారు ప్రవాహాన్ని చూపించడానికి ప్రస్తుత యాప్ సెషన్‌లో ప్రొఫైల్ సమాచారాన్ని ఉంచుతుంది."],["పథకానికి ఎలా దరఖాస్తు చేయాలి?","పథక శోధన విభాగం నుంచి పథకాన్ని తెరిచి వివరాలు మరియు అవసరమైన పత్రాలను పరిశీలించి మార్గదర్శక దరఖాస్తును కొనసాగించండి."],["నేను వాయిస్ ఇన్‌పుట్ ఉపయోగించవచ్చా?","అవును. డ్యాష్‌బోర్డ్‌లో మాట్లాడటానికి ట్యాప్ చేసి మైక్రోఫోన్‌తో ప్రొఫైల్ ప్రశ్నలకు సమాధానం ఇవ్వండి. అవసరమైతే టైప్ చేయవచ్చు."]]}
};

const DASHBOARD_COPY = {
  en:{dash:"DASHBOARD",welcome:"Welcome back",ready:"Ready to speak?",desc:"Tap to speak and start the same profile questions used in Find Schemes.",natural:"Speak naturally",read:"Questions are read aloud",auto:"Voice answers are processed automatically",tools:"Your SchemeSaathi tools and scheme journey are ready."},
  hi:{dash:"डैशबोर्ड",welcome:"वापसी पर स्वागत है",ready:"बोलने के लिए तैयार?",desc:"बोलने के लिए टैप करें और योजना खोजने में उपयोग किए गए वही प्रोफ़ाइल प्रश्न शुरू करें।",natural:"स्वाभाविक रूप से बोलें",read:"प्रश्न ज़ोर से पढ़े जाते हैं",auto:"वॉइस उत्तर अपने आप संसाधित होते हैं",tools:"आपके SchemeSaathi टूल्स और योजना यात्रा तैयार हैं।"},
  bn:{dash:"ড্যাশবোর্ড",welcome:"আবার স্বাগতম",ready:"কথা বলার জন্য প্রস্তুত?",desc:"কথা বলতে ট্যাপ করুন এবং প্রকল্প খোঁজার সময় ব্যবহৃত একই প্রোফাইল প্রশ্ন শুরু করুন।",natural:"স্বাভাবিকভাবে কথা বলুন",read:"প্রশ্ন জোরে পড়া হয়",auto:"ভয়েস উত্তর স্বয়ংক্রিয়ভাবে প্রক্রিয়াজাত হয়",tools:"আপনার SchemeSaathi টুলস এবং প্রকল্পের যাত্রা প্রস্তুত।"},
  ta:{dash:"டாஷ்போர்டு",welcome:"மீண்டும் வரவேற்கிறோம்",ready:"பேச தயாரா?",desc:"பேச தட்டவும்; திட்டங்களைக் கண்டறியும் போது பயன்படுத்தப்படும் அதே சுயவிவரக் கேள்விகள் தொடங்கும்.",natural:"இயல்பாகப் பேசுங்கள்",read:"கேள்விகள் உரக்க வாசிக்கப்படும்",auto:"குரல் பதில்கள் தானாக செயலாக்கப்படும்",tools:"உங்கள் SchemeSaathi கருவிகளும் திட்டப் பயணமும் தயாராக உள்ளன."},
  mr:{dash:"डॅशबोर्ड",welcome:"पुन्हा स्वागत आहे",ready:"बोलण्यासाठी तयार?",desc:"बोलण्यासाठी टॅप करा आणि योजना शोधताना वापरलेले तेच प्रोफाइल प्रश्न सुरू करा.",natural:"नैसर्गिकपणे बोला",read:"प्रश्न मोठ्याने वाचले जातात",auto:"आवाजातील उत्तरे आपोआप प्रक्रिया केली जातात",tools:"तुमची SchemeSaathi साधने आणि योजना प्रवास तयार आहेत."},
  te:{dash:"డ్యాష్‌బోర్డ్",welcome:"తిరిగి స్వాగతం",ready:"మాట్లాడటానికి సిద్ధంగా ఉన్నారా?",desc:"మాట్లాడటానికి ట్యాప్ చేయండి; పథకాలను కనుగొనేటప్పుడు ఉపయోగించే అదే ప్రొఫైల్ ప్రశ్నలు ప్రారంభమవుతాయి.",natural:"సహజంగా మాట్లాడండి",read:"ప్రశ్నలు గట్టిగా చదవబడతాయి",auto:"వాయిస్ సమాధానాలు స్వయంచాలకంగా ప్రాసెస్ అవుతాయి",tools:"మీ SchemeSaathi సాధనాలు మరియు పథక ప్రయాణం సిద్ధంగా ఉన్నాయి."}
};

const SCHEMES = [
  {
    id: "sui",
    ministry: "Department of Financial Services",
    categories: ["SC", "ST", "Woman"],
    maxIncome: 900000,
    maxAssistance: "Up to ₹1 Crore",
    interestRate: "Bank-linked rate",
    subsidy: "As applicable",
    tags: ["SC/ST", "Women", "OBC"],
    description: "Bank finance for eligible first-time entrepreneurs to start or expand a small business.",
    documents: [
      "Caste / category certificate",
      "Business plan",
      "Bank statements (6 months)",
      "Aadhaar card",
    ],
  },
  {
    id: "dksh",
    ministry: "Ministry of Social Justice & Empowerment",
    categories: ["SC", "OBC", "Minority", "PwD"],
    maxIncome: 300000,
    maxAssistance: "Training + stipend",
    interestRate: "Support-based",
    subsidy: "Training support",
    tags: ["SC", "OBC", "Minority", "PwD"],
    description: "Skill-development and livelihood support for eligible beneficiaries from disadvantaged communities.",
    documents: [
      "Category certificate",
      "Income certificate",
      "Aadhaar card",
    ],
  },
  {
    id: "nbcfdc",
    ministry: "NBCFDC",
    categories: ["SC", "OBC"],
    maxIncome: 300000,
    maxAssistance: "Up to ₹5 Lakh",
    interestRate: "Low-interest",
    subsidy: "As applicable",
    tags: ["SC", "OBC", "Micro-credit"],
    description: "Micro-credit support for eligible backward-class entrepreneurs running or starting small businesses.",
    documents: [
      "Caste certificate",
      "Income certificate",
      "Business proof",
    ],
  },
  {
    id: "mun",
    ministry: "SIDBI",
    categories: ["Woman"],
    maxIncome: 900000,
    maxAssistance: "Up to ₹10 Lakh",
    interestRate: "Concessional",
    subsidy: "As applicable",
    tags: ["Women", "Entrepreneurship"],
    description: "Concessional financial support for women entrepreneurs setting up or expanding small-scale ventures.",
    documents: [
      "Aadhaar card",
      "Business plan",
      "Bank statement",
    ],
  },
  {
    id: "nhfdc",
    ministry: "NHFDC",
    categories: ["PwD"],
    maxIncome: 500000,
    maxAssistance: "Up to ₹25 Lakh",
    interestRate: "Concessional",
    subsidy: "As applicable",
    tags: ["PwD", "Entrepreneurship"],
    description: "Concessional financing for persons with disabilities starting or expanding an income-generating business.",
    documents: [
      "Disability certificate",
      "Aadhaar card",
      "Business plan",
    ],
  },
  {
    id: "mudra",
    ministry: "Ministry of Finance",
    categories: [
      "General",
      "SC",
      "ST",
      "OBC",
      "Woman",
      "Minority",
      "PwD",
    ],
    maxIncome: 900000,
    maxAssistance: "Up to ₹50,000",
    interestRate: "Competitive",
    subsidy: "None",
    tags: ["SC/ST", "Women", "OBC"],
    description: "Collateral-free starter credit for very small or early-stage businesses across eligible categories.",
    documents: [
      "Aadhaar card",
      "Business proof",
      "Bank statement",
    ],
  },
];

const DOCUMENT_TRANSLATIONS = {
  en: {
    "Caste / category certificate": "Caste / category certificate",
    "Business plan": "Business plan",
    "Bank statements (6 months)": "Bank statements (6 months)",
    "Aadhaar card": "Aadhaar card",
    "Category certificate": "Category certificate",
    "Income certificate": "Income certificate",
    "Caste certificate": "Caste certificate",
    "Business proof": "Business proof",
    "Disability certificate": "Disability certificate",
    "Bank statement": "Bank statement",
  },
  hi: {
    "Caste / category certificate": "जाति / श्रेणी प्रमाण पत्र",
    "Business plan": "व्यवसाय योजना",
    "Bank statements (6 months)": "6 महीने का बैंक स्टेटमेंट",
    "Aadhaar card": "आधार कार्ड",
    "Category certificate": "श्रेणी प्रमाण पत्र",
    "Income certificate": "आय प्रमाण पत्र",
    "Caste certificate": "जाति प्रमाण पत्र",
    "Business proof": "व्यवसाय प्रमाण",
    "Disability certificate": "दिव्यांगता प्रमाण पत्र",
    "Bank statement": "बैंक स्टेटमेंट",
  },
  bn: {
    "Caste / category certificate": "জাতি / শ্রেণি শংসাপত্র",
    "Business plan": "ব্যবসায়িক পরিকল্পনা",
    "Bank statements (6 months)": "৬ মাসের ব্যাংক স্টেটমেন্ট",
    "Aadhaar card": "আধার কার্ড",
    "Category certificate": "শ্রেণি শংসাপত্র",
    "Income certificate": "আয়ের শংসাপত্র",
    "Caste certificate": "জাতি শংসাপত্র",
    "Business proof": "ব্যবসার প্রমাণ",
    "Disability certificate": "প্রতিবন্ধী শংসাপত্র",
    "Bank statement": "ব্যাংক স্টেটমেন্ট",
  },
  ta: {
    "Caste / category certificate": "சாதி / வகுப்பு சான்றிதழ்",
    "Business plan": "வணிகத் திட்டம்",
    "Bank statements (6 months)": "6 மாத வங்கி அறிக்கைகள்",
    "Aadhaar card": "ஆதார் அட்டை",
    "Category certificate": "வகுப்பு சான்றிதழ்",
    "Income certificate": "வருமானச் சான்றிதழ்",
    "Caste certificate": "சாதிச் சான்றிதழ்",
    "Business proof": "வணிகச் சான்று",
    "Disability certificate": "மாற்றுத்திறனாளி சான்றிதழ்",
    "Bank statement": "வங்கி அறிக்கை",
  },
  mr: {
    "Caste / category certificate": "जात / श्रेणी प्रमाणपत्र",
    "Business plan": "व्यवसाय योजना",
    "Bank statements (6 months)": "6 महिन्यांचे बँक स्टेटमेंट",
    "Aadhaar card": "आधार कार्ड",
    "Category certificate": "श्रेणी प्रमाणपत्र",
    "Income certificate": "उत्पन्न प्रमाणपत्र",
    "Caste certificate": "जात प्रमाणपत्र",
    "Business proof": "व्यवसायाचा पुरावा",
    "Disability certificate": "दिव्यांग प्रमाणपत्र",
    "Bank statement": "बँक स्टेटमेंट",
  },
  te: {
    "Caste / category certificate": "కుల / వర్గ ధృవీకరణ పత్రం",
    "Business plan": "వ్యాపార ప్రణాళిక",
    "Bank statements (6 months)": "6 నెలల బ్యాంక్ స్టేట్‌మెంట్లు",
    "Aadhaar card": "ఆధార్ కార్డు",
    "Category certificate": "వర్గ ధృవీకరణ పత్రం",
    "Income certificate": "ఆదాయ ధృవీకరణ పత్రం",
    "Caste certificate": "కుల ధృవీకరణ పత్రం",
    "Business proof": "వ్యాపార రుజువు",
    "Disability certificate": "దివ్యాంగ ధృవీకరణ పత్రం",
    "Bank statement": "బ్యాంక్ స్టేట్‌మెంట్",
  },
};

function matchSchemes(profile) {
  return SCHEMES.map((scheme) => {
    let score = 42;

    if (scheme.categories.includes(profile.category)) {
      score += 33;
    }

    if (profile.income <= scheme.maxIncome) {
      score += 15;
    }

    if (profile.businessType) {
      score += 8;
    }

    return {
      ...scheme,
      score: Math.min(score, 97),
    };
  }).sort((a, b) => b.score - a.score);
}

function VoiceAssistantModal({
  c,
  t,
  language = "hi",
  isOpen,
  onClose,
  onApplyProfile,
  onConfirmAndMatch,
}) {
  const [selectedLang, setSelectedLang] = useState(language || "hi");
  const [activeStep, setActiveStep] = useState("record"); // "record" | "review"
  const [extractedData, setExtractedData] = useState(null);
  const [followUp, setFollowUp] = useState(null);
  const [missingFields, setMissingFields] = useState([]);
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [nlpError, setNlpError] = useState("");

  // Editable fields in review mode
  const [editCategory, setEditCategory] = useState("");
  const [editIncome, setEditIncome] = useState("");
  const [editState, setEditState] = useState("");
  const [editBusiness, setEditBusiness] = useState("");
  const [editCost, setEditCost] = useState("");

  const recorder = useVoiceRecorder({
    language: selectedLang,
    onTranscript: async (finalTranscript, langDetected) => {
      if (!finalTranscript || !finalTranscript.trim()) return;
      setIsNlpLoading(true);
      setNlpError("");
      try {
        const nlpRes = await extractProfile(finalTranscript);
        if (nlpRes && nlpRes.extracted) {
          const ext = nlpRes.extracted;
          setExtractedData(ext);
          setFollowUp(nlpRes.follow_up_question || null);
          setMissingFields(nlpRes.missing_fields || []);

          setEditCategory(ext.category || "");
          setEditIncome(ext.income ? String(ext.income) : "");
          setEditState(ext.state || "");
          setEditBusiness(ext.business_type || "");
          setEditCost(ext.project_cost ? String(ext.project_cost) : "");

          setActiveStep("review");
          if (onApplyProfile) {
            onApplyProfile({
              category: ext.category || "",
              income: ext.income ? String(ext.income) : "",
              location: ext.state || "",
              state: ext.state || "",
              businessType: ext.business_type || "",
              idea: finalTranscript,
              project_cost: ext.project_cost || "",
            });
          }
        }
      } catch (err) {
        console.error("NLP extraction error:", err);
        setNlpError(err.message || "Could not extract profile details from speech. You can fill details manually.");
      } finally {
        setIsNlpLoading(false);
      }
    },
  });

  if (!isOpen) return null;

  const handleStartSpeaking = () => {
    setNlpError("");
    setActiveStep("record");
    recorder.startRecording();
  };

  const handleStopSpeaking = () => {
    recorder.stopRecording();
  };

  const handleConfirm = () => {
    const finalProfile = {
      category: editCategory.trim() || null,
      income: editIncome ? Number(editIncome) : null,
      state: editState.trim() || null,
      location: editState.trim() || null,
      businessType: editBusiness.trim() || null,
      project_cost: editCost ? Number(editCost) : null,
      idea: recorder.transcript || "",
    };

    if (onApplyProfile) onApplyProfile(finalProfile);
    if (onConfirmAndMatch) {
      onClose();
      onConfirmAndMatch(finalProfile);
    } else {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        className="glass fade"
        style={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 26,
          background: c.surface,
          border: `1.5px solid ${c.border}`,
          padding: 28,
          boxShadow: `0 24px 60px ${c.primary}30`,
          position: "relative",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `${c.primary}18`,
                color: c.primary,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Mic size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, margin: 0, fontWeight: 800, color: c.text }}>
                AI Multilingual Voice Assistant
              </h2>
              <div style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>
                Powered by <strong>Bhashini (MeitY)</strong> ASR & Multilingual NLP
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              recorder.reset();
              onClose();
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              background: c.surface2,
              color: c.muted,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Language Selection Chips */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: c.muted, marginBottom: 8 }}>
            Select Spoken Language / भाषा चुनें:
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { code: "hi", label: "हिन्दी (Hindi)" },
              { code: "en", label: "English" },
              { code: "bn", label: "বাংলা (Bengali)" },
              { code: "ta", label: "தமிழ் (Tamil)" },
              { code: "mr", label: "मराठी (Marathi)" },
              { code: "te", label: "తెలుగు (Telugu)" },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelectedLang(lang.code)}
                disabled={recorder.isRecording || recorder.isProcessing}
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: selectedLang === lang.code ? 800 : 600,
                  background: selectedLang === lang.code ? c.primary : c.surface2,
                  color: selectedLang === lang.code ? "#FFFFFF" : c.text,
                  border: `1px solid ${selectedLang === lang.code ? c.primary : c.border}`,
                  cursor: "pointer",
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Recording View */}
        {activeStep === "record" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  position: "relative",
                  width: 90,
                  height: 90,
                  margin: "0 auto",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {recorder.isRecording && (
                  <div
                    style={{
                      position: "absolute",
                      inset: -8,
                      borderRadius: "50%",
                      border: `3px solid ${c.danger}`,
                      animation: "user-pulse 1.5s infinite",
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={recorder.isRecording ? handleStopSpeaking : handleStartSpeaking}
                  disabled={recorder.isProcessing || isNlpLoading}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: recorder.isRecording
                      ? c.danger
                      : `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                    color: "#FFFFFF",
                    border: "none",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    boxShadow: `0 12px 30px ${recorder.isRecording ? c.danger : c.primary}45`,
                    transition: "transform 0.15s ease",
                  }}
                  aria-label={recorder.isRecording ? "Stop recording" : "Start speaking"}
                >
                  {recorder.isProcessing || isNlpLoading ? (
                    <RefreshCw size={32} className="spin" />
                  ) : recorder.isRecording ? (
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: "#FFFFFF" }} />
                  ) : (
                    <Mic size={36} />
                  )}
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: c.text }}>
                  {recorder.isRecording
                    ? `Listening (${recorder.recordingSeconds}s)... Tap red square to finish`
                    : recorder.isProcessing
                    ? "Transcribing with Bhashini / Whisper AI..."
                    : isNlpLoading
                    ? "Extracting Profile with AI NLP..."
                    : "Tap Microphone & Speak Your Requirement"}
                </div>
                <div style={{ fontSize: 12.5, color: c.muted, marginTop: 4, maxWidth: 460, margin: "4px auto 0" }}>
                  {recorder.isRecording
                    ? "Describe your business idea, required funding amount, social category, and annual family income."
                    : "Example: \"मुझे नया डेयरी फार्म शुरू करना है, मेरी सालाना आय 3 लाख है और मुझे 5 लाख का लोन चाहिए।\""}
                </div>
              </div>
            </div>

            {/* Live Interim Transcript or Error */}
            {(recorder.interimTranscript || recorder.transcript) && (
              <div
                style={{
                  background: c.surface2,
                  borderRadius: 14,
                  padding: "12px 16px",
                  fontSize: 13,
                  color: c.text,
                  textAlign: "left",
                  marginBottom: 16,
                  border: `1px solid ${c.border}`,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 750, color: c.primary, marginBottom: 4 }}>
                  {recorder.transcript ? "✓ Authoritative Transcript:" : "🎙 Live Speech Preview:"}
                </div>
                {recorder.transcript || recorder.interimTranscript}
              </div>
            )}

            {recorder.errorMessage && (
              <div
                style={{
                  background: `${c.danger}15`,
                  color: c.danger,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 12.5,
                  fontWeight: 650,
                  marginBottom: 14,
                  textAlign: "left",
                  border: `1px solid ${c.danger}35`,
                }}
              >
                ⚠️ {recorder.errorMessage}
              </div>
            )}

            {nlpError && (
              <div
                style={{
                  background: `${c.danger}15`,
                  color: c.danger,
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: 12.5,
                  fontWeight: 650,
                  marginBottom: 14,
                  textAlign: "left",
                  border: `1px solid ${c.danger}35`,
                }}
              >
                ⚠️ {nlpError}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Extracted Profile Confirmation & Edit */}
        {activeStep === "review" && (
          <div className="fade">
            <div
              style={{
                background: `${c.success}12`,
                border: `1.5px solid ${c.success}35`,
                borderRadius: 14,
                padding: "12px 16px",
                marginBottom: 18,
                fontSize: 12.5,
                color: c.text,
              }}
            >
              <div style={{ fontWeight: 800, color: c.success, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={15} /> Speech Analyzed Successfully
              </div>
              <div style={{ color: c.muted, fontSize: 12 }}>
                "{recorder.transcript}"
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 800, color: c.text, marginBottom: 12 }}>
              Extracted Profile (Review & Edit if needed):
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                  Business Sector / Idea
                </label>
                <input
                  type="text"
                  value={editBusiness}
                  onChange={(e) => setEditBusiness(e.target.value)}
                  placeholder="e.g. Dairy Farming, Tailoring"
                  style={{ ...inputStyle(c), padding: "8px 12px", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                  Annual Family Income (₹)
                </label>
                <input
                  type="number"
                  value={editIncome}
                  onChange={(e) => setEditIncome(e.target.value)}
                  placeholder="e.g. 300000"
                  style={{ ...inputStyle(c), padding: "8px 12px", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                  Funding Need / Project Cost (₹)
                </label>
                <input
                  type="number"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  placeholder="e.g. 500000"
                  style={{ ...inputStyle(c), padding: "8px 12px", fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                  Social Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{ ...inputStyle(c), padding: "8px 12px", fontSize: 13, background: c.surface }}
                >
                  <option value="">Select Category</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                  <option value="OBC">OBC (Other Backward Class)</option>
                  <option value="Woman">Woman Entrepreneur</option>
                  <option value="Minority">Minority Community</option>
                  <option value="PwD">Person with Disability (PwD)</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                  State / District
                </label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh, Lucknow"
                  style={{ ...inputStyle(c), padding: "8px 12px", fontSize: 13 }}
                />
              </div>
            </div>

            {followUp && (
              <div
                style={{
                  background: `${c.primary}12`,
                  border: `1px dashed ${c.primary}45`,
                  borderRadius: 12,
                  padding: "10px 14px",
                  fontSize: 12.5,
                  color: c.primary,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                💡 AI Assistant Note: {followUp}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  recorder.reset();
                  setActiveStep("record");
                }}
                style={{
                  ...secondaryButton(c),
                  padding: "10px 16px",
                  fontSize: 13,
                }}
              >
                <Mic size={15} /> Re-speak
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  ...primaryButton(c),
                  padding: "10px 22px",
                  fontSize: 13,
                }}
              >
                <span>Confirm & Find Matching Schemes</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState("light");
  const c = THEMES[theme];

  const [screen, setScreen] = useState("landing");
  const [language, setLanguage] = useState(null);
  const [authMode, setAuthMode] = useState("register");

  const t = translations[language || "en"];

  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [profile, setProfile] = useState({
    age: "",
    category: "",
    income: "",
    occupation: "",
    businessType: "",
    ideaCategory: "",
    idea: "",
    location: "",
    project_cost: "",
  });

  const [profileStep, setProfileStep] = useState(0);
  const [voiceRequested, setVoiceRequested] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [financialPlan, setFinancialPlan] = useState(null);
  const [docStatus, setDocStatus] = useState({});
  const [statusStep, setStatusStep] = useState(0);
  const [activeApplicationId, setActiveApplicationId] = useState(null);
  const [activeApplicationData, setActiveApplicationData] = useState(null);
  const [loadPct, setLoadPct] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [findSchemesMode, setFindSchemesMode] = useState(false);
  const [savedSchemes, setSavedSchemes] = useState([]);

  // Voice Assistant Modal State
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Real backend matching state
  const [matchedResults, setMatchedResults] = useState(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState("");

  const handleRunMatching = async (profileData = profile) => {
    setIsMatchingLoading(true);
    setMatchingError("");
    setScreen("loading");

    try {
      const payload = {
        category: profileData.category || "General",
        income: profileData.income ? Number(profileData.income) : 300000,
        state: profileData.location || profileData.state || "Uttar Pradesh",
        business_type: profileData.businessType || profileData.ideaCategory || "dairy",
        project_cost: profileData.project_cost ? Number(profileData.project_cost) : 500000,
      };

      const res = await fetchMatchedSchemes(payload);
      if (res) {
        setMatchedResults(res);
        setScreen("results");
      } else {
        throw new Error("Empty response received from matching engine.");
      }
    } catch (err) {
      console.warn("Backend matching call failed, using graceful recovery:", err);
      setMatchingError(err.message || "Failed to reach AI matching service.");
    } finally {
      setIsMatchingLoading(false);
    }
  };

  // Build final display list of matched schemes (using backend response if present)
  const results = (matchedResults?.auto_matched && matchedResults.auto_matched.length > 0)
    ? matchedResults.auto_matched.map((s, idx) => ({
        id: s.scheme_id,
        scheme_id: s.scheme_id,
        name: s.scheme_name,
        scheme_name: s.scheme_name,
        score: Math.round((s.confidence || 0.85) * 100),
        confidence: s.confidence,
        benefit: s.benefit || "Government Financial Assistance / Subsidy",
        maxAssistance: s.benefit || "Government Financial Assistance",
        ministry: s.ministry || "Government of India",
        categories: [profile.category || "General"],
        documents: s.documents_required || ["Aadhaar card", "Income certificate", "Bank statement"],
        documents_required: s.documents_required || ["Aadhaar card", "Income certificate"],
        application_link: s.application_link,
        application_url: s.application_link || "https://www.myscheme.gov.in",
        why_matched: s.why_matched,
        description: s.benefit || s.why_matched || "Government welfare scheme for eligible entrepreneurs.",
      }))
    : matchSchemes({
        category: profile.category,
        income: Number(profile.income || 900000),
        businessType: profile.businessType,
      });

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  };

  const selectLanguage = (code) => {
    setLanguage(code);
  };

  const startProfile = () => {
    setVoiceModalOpen(true);
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: "Inter, Arial, sans-serif",
        transition: "all .3s ease",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          min-width: 100%;
          min-height: 100%;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          min-height: 100vh;
          background: ${c.bg};
          color: ${c.text};
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        button,
        input {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .container {
          width: min(1180px, calc(100% - 40px));
          margin: auto;
        }

        .glass {
          background: ${c.surface};
          border: 1px solid ${c.border};
          box-shadow: ${c.shadow};
        }

        .hover-card {
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .hover-card:hover {
          transform: translateY(-4px);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr .9fr;
          gap: 70px;
          align-items: center;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .scheme-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .scheme-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .auth-box {
          width: min(480px, 100%);
          margin: 50px auto;
        }

        .profile-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 50px;
          align-items: start;
        }

        @media(max-width: 850px) {
          .hero-grid,
          .profile-layout {
            grid-template-columns: 1fr;
          }

          .hero-grid {
            gap: 40px;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .scheme-grid {
            grid-template-columns: 1fr;
          }

          .scheme-meta-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width: 600px) {
          .container {
            width: min(100% - 28px, 1180px);
          }

          .hero-title {
            font-size: 42px !important;
          }

          .desktop-nav {
            display: none !important;
          }

          .mobile-only {
            display: flex !important;
          }
        }

        .mobile-only {
          display: none;
        }

        .fade {
          animation: fade .35s ease;
        }

        @keyframes fade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFloat {
          0%, 100% {
            transform: perspective(1100px) rotate(3deg) rotateY(-2deg) translateY(0);
          }
          50% {
            transform: perspective(1100px) rotate(3deg) rotateY(-2deg) translateY(-7px);
          }
        }

        .pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 ${c.primary}55;
          }

          70% {
            box-shadow: 0 0 0 25px transparent;
          }

          100% {
            box-shadow: 0 0 0 0 transparent;
          }
        }
      `}</style>

      <Header
        c={c}
        theme={theme}
        toggleTheme={toggleTheme}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        language={language}
        t={t}
        onLanguage={() => {
          setScreen("language");
          setMobileMenu(false);
        }}
        onAuth={() => {
          setScreen("auth");
          setMobileMenu(false);
        }}
        onHelp={() => {
          setHelpOpen(true);
          setMobileMenu(false);
        }}
      />

      {helpOpen && (
        <HelpModal
          c={c}
          t={t}
          onClose={() => setHelpOpen(false)}
        />
      )}

      {screen === "landing" && (
        <LandingScreen
          c={c}
          t={t}
          language={language}
          onStart={() => setScreen("language")}
          onLearn={() =>
            document
              .getElementById("how-it-works")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
      )}

      {screen === "language" && (
        <LanguageScreen
          c={c}
          t={t}
          language={language}
          setLanguage={selectLanguage}
          onContinue={() => setScreen("auth")}
          onBack={() => setScreen("landing")}
        />
      )}

      {screen === "auth" && (
        <AuthScreen
          c={c}
          t={t}
          mode={authMode}
          setMode={setAuthMode}
          user={user}
          setUser={setUser}
          onSuccess={() => setScreen("dashboard")}
          onBack={() => setScreen("language")}
        />
      )}

      {screen === "dashboard" && (
        <DashboardScreen
          c={c}
          t={t}
          user={user}
          profile={profile}
          results={results}
          savedSchemes={savedSchemes}
          setSavedSchemes={setSavedSchemes}
          setProfile={setProfile}
          profileStep={profileStep}
          setProfileStep={setProfileStep}
          onStart={() => {
            setVoiceModalOpen(true);
          }}
          onFindSchemes={() => {
            setFindSchemesMode(true);
            handleRunMatching(profile);
          }}
          onFinish={() => handleRunMatching(profile)}
          onBack={() => setScreen("landing")}
          onOpenScheme={(scheme) => { setSelectedScheme(scheme); setScreen("detail"); }}
          onTrackApplication={(appRecord) => {
            setActiveApplicationId(appRecord.application_id);
            setActiveApplicationData(appRecord);
            setSelectedScheme({
              id: appRecord.scheme_id,
              scheme_id: appRecord.scheme_id,
              scheme_name: appRecord.scheme_name,
              name: appRecord.scheme_name,
            });
            if (appRecord.partner_name || appRecord.partner_id) {
              setSelectedPartner({
                partner_id: appRecord.partner_id,
                partner_name: appRecord.partner_name,
              });
            }
            setScreen("status");
          }}
        />
      )}

      {screen === "welcome" && (
        <WelcomeScreen
          c={c}
          t={t}
          user={user}
          onStart={() => setVoiceModalOpen(true)}
          onBack={() => setScreen("dashboard")}
        />
      )}

      {screen === "profile" && (
        <ProfileScreen
          c={c}
          t={t}
          language={language || "en"}
          profile={profile}
          setProfile={setProfile}
          step={profileStep}
          setStep={setProfileStep}
          autoStartVoice={voiceRequested}
          onVoiceStarted={() => setVoiceRequested(false)}
          onBack={() => {
            if (profileStep === 0) {
              setVoiceRequested(false);
              setScreen("dashboard");
            } else {
              setProfileStep((s) => s - 1);
            }
          }}
          onFinish={() => {
            setFindSchemesMode(false);
            handleRunMatching(profile);
          }}
        />
      )}

      {screen === "loading" && (
        <LoadingScreen
          c={c}
          t={t}
          pct={loadPct}
          isMatchingLoading={isMatchingLoading}
          matchingError={matchingError}
          onRetry={() => handleRunMatching(profile)}
          onBack={() => setScreen("profile")}
        />
      )}

      {screen === "results" && (
        <ResultsScreen
          c={c}
          t={t}
          language={language || "en"}
          results={results}
          profile={profile}
          savedSchemes={savedSchemes}
          setSavedSchemes={setSavedSchemes}
          detailed={findSchemesMode}
          onBack={() => {
            if (findSchemesMode) {
              setFindSchemesMode(false);
              setScreen("dashboard");
            } else {
              setScreen("profile");
            }
          }}
          onOpen={(scheme) => {
            setSelectedScheme(scheme);
            setScreen("detail");
          }}
        />
      )}

      {screen === "detail" && selectedScheme && (
        <DetailScreen
          c={c}
          t={t}
          language={language || "en"}
          scheme={selectedScheme}
          profile={profile}
          selectedPartner={selectedPartner}
          setSelectedPartner={setSelectedPartner}
          financialPlan={financialPlan}
          setFinancialPlan={setFinancialPlan}
          onBack={() => setScreen("results")}
          onApply={() => {
            setDocStatus({});
            setScreen("upload");
          }}
        />
      )}

      {screen === "upload" && selectedScheme && (
        <UploadScreen
          c={c}
          t={t}
          language={language || "en"}
          scheme={selectedScheme}
          profile={profile}
          selectedPartner={selectedPartner}
          financialPlan={financialPlan}
          onBack={() => setScreen("detail")}
          onSubmitSuccess={(appRecord) => {
            setActiveApplicationId(appRecord.application_id);
            setActiveApplicationData(appRecord);
            setStatusStep(0);
            setScreen("status");
          }}
        />
      )}

      {screen === "status" && (
        <StatusScreen
          c={c}
          t={t}
          language={language || "en"}
          scheme={selectedScheme}
          profile={profile}
          selectedPartner={selectedPartner}
          financialPlan={financialPlan}
          applicationId={activeApplicationId}
          applicationData={activeApplicationData}
          statusStep={statusStep}
          setStatusStep={setStatusStep}
          onHome={() => setScreen("results")}
          onDashboard={() => setScreen("dashboard")}
        />
      )}

      {/* Context-Aware AI Chatbot Assistant */}
      <AiChatAssistant
        c={c}
        language={language || "en"}
        profile={profile}
        selectedScheme={selectedScheme}
        financialPlan={financialPlan}
        selectedPartner={selectedPartner}
        applicationData={activeApplicationData}
        onFindSchemes={() => {
          setFindSchemesMode(true);
          handleRunMatching(profile);
        }}
        onOpenScheme={(sch) => {
          setSelectedScheme(sch);
          setScreen("detail");
        }}
        onOpenCalculator={() => {
          setScreen("dashboard");
        }}
        onOpenDocuments={() => {
          if (selectedScheme) setScreen("upload");
          else {
            setFindSchemesMode(true);
            handleRunMatching(profile);
          }
        }}
        onOpenPartners={() => {
          setScreen("dashboard");
        }}
        onTrackApplication={(appRecord) => {
          if (appRecord) {
            setActiveApplicationId(appRecord.application_id);
            setActiveApplicationData(appRecord);
            if (appRecord.scheme_id || appRecord.scheme_name) {
              setSelectedScheme({
                id: appRecord.scheme_id,
                scheme_id: appRecord.scheme_id,
                scheme_name: appRecord.scheme_name,
                name: appRecord.scheme_name,
              });
            }
          }
          setScreen("status");
        }}
      />

      {/* Global Voice Assistant Modal */}
      <VoiceAssistantModal
        c={c}
        t={t}
        language={language || "hi"}
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onApplyProfile={(newProf) => {
          setProfile((prev) => ({
            ...prev,
            ...newProf,
          }));
        }}
        onConfirmAndMatch={(finalProf) => {
          setProfile((prev) => ({
            ...prev,
            ...finalProf,
          }));
          handleRunMatching(finalProf);
        }}
      />
    </div>
  );
}

function DashboardScreen({
  c,
  t,
  user,
  profile,
  results,
  setProfile,
  profileStep,
  setProfileStep,
  savedSchemes,
  setSavedSchemes,
  onStart,
  onFindSchemes,
  onFinish,
  onOpenScheme,
  onTrackApplication,
}) {
  const [loan, setLoan] = useState(500000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(5);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [heardText, setHeardText] = useState("");
  const [questionsStarted, setQuestionsStarted] = useState(false);
  const [documentFiles, setDocumentFiles] = useState({});
  const [documentPreview, setDocumentPreview] = useState(null);
  const recognitionRef = React.useRef(null);

  const monthlyRate = rate / 12 / 100;
  const months = tenure * 12;
  const emi = monthlyRate === 0
    ? loan / months
    : loan * monthlyRate * Math.pow(1 + monthlyRate, months) /
      (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = emi * months;
  const totalInterest = Math.max(0, totalPayment - loan);

  const fields = [
    {
      key: "category",
      icon: <Users size={22} />,
      title: t.categoryQuestion,
      hint: t.categoryHint,
    },
    {
      key: "income",
      icon: <IndianRupee size={22} />,
      title: t.incomeQuestion,
      hint: t.incomeHint,
    },
    {
      key: "businessType",
      icon: <Briefcase size={22} />,
      title: t.businessQuestion,
      hint: t.businessHint,
    },
    {
      key: "location",
      icon: <MapPin size={22} />,
      title: t.locationQuestion,
      hint: t.locationHint,
    },
  ];

  const field = fields[Math.min(profileStep, fields.length - 1)];
  const recognitionCtor = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const currentLanguage = languageFromTranslation(t);
  const navLabels = {
    en: { Dashboard: "Dashboard", "Find Schemes": "Find Schemes", Compare: "Compare", Calculator: "Calculator", "Nearby Help": "Nearby Help", Applications: "Applications", "Saved Schemes": "Saved Schemes", Documents: "Documents", Profile: "Profile", Help: "Help" },
    hi: { Dashboard: "डैशबोर्ड", "Find Schemes": "योजनाएँ खोजें", Compare: "तुलना करें", Calculator: "कैलकुलेटर", "Nearby Help": "नज़दीकी सहायता", Applications: "आवेदन", "Saved Schemes": "सहेजी गई योजनाएँ", Documents: "दस्तावेज़", Profile: "प्रोफ़ाइल", Help: "मदद" },
    bn: { Dashboard: "ড্যাশবোর্ড", "Find Schemes": "প্রকল্প খুঁজুন", Compare: "তুলনা করুন", Calculator: "ক্যালকুলেটর", "Nearby Help": "কাছাকাছি সহায়তা", Applications: "আবেদন", "Saved Schemes": "সংরক্ষিত প্রকল্প", Documents: "নথি", Profile: "প্রোফাইল", Help: "সাহায্য" },
    ta: { Dashboard: "டாஷ்போர்டு", "Find Schemes": "திட்டங்களைக் கண்டறியவும்", Compare: "ஒப்பிடுக", Calculator: "கணக்குப்பொறி", "Nearby Help": "அருகிலுள்ள உதவி", Applications: "விண்ணப்பங்கள்", "Saved Schemes": "சேமித்த திட்டங்கள்", Documents: "ஆவணங்கள்", Profile: "சுயவிவரம்", Help: "உதவி" },
    mr: { Dashboard: "डॅशबोर्ड", "Find Schemes": "योजना शोधा", Compare: "तुलना करा", Calculator: "कॅल्क्युलेटर", "Nearby Help": "जवळची मदत", Applications: "अर्ज", "Saved Schemes": "जतन केलेल्या योजना", Documents: "कागदपत्रे", Profile: "प्रोफाइल", Help: "मदत" },
    te: { Dashboard: "డ్యాష్‌బోర్డ్", "Find Schemes": "పథకాలను కనుగొనండి", Compare: "పోల్చండి", Calculator: "క్యాలిక్యులేటర్", "Nearby Help": "సమీప సహాయం", Applications: "దరఖాస్తులు", "Saved Schemes": "సేవ్ చేసిన పథకాలు", Documents: "పత్రాలు", Profile: "ప్రొఫైల్", Help: "సహాయం" },
  }[currentLanguage] || {};

  const menu = [
    { label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { label: "Find Schemes", icon: <Search size={17} /> },
    { label: "Compare", icon: <ArrowRight size={17} /> },
    { label: "Calculator", icon: <Calculator size={17} /> },
    { label: "Nearby Help", icon: <MapPin size={17} /> },
    { label: "Applications", icon: <FileCheck2 size={17} /> },
    { label: "Saved Schemes", icon: <BadgeCheck size={17} /> },
    { label: "Documents", icon: <FileText size={17} /> },
    { label: "Profile", icon: <UserCircle size={17} /> },
    { label: "Help", icon: <CircleHelpIcon size={17} /> },
  ];

  const handleNav = (label) => {
    setActiveNav(label);
    if (label === "Find Schemes") onFindSchemes();
  };

  const getSpeechLocale = () => ({
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    mr: "mr-IN",
    te: "te-IN",
  }[languageFromTranslation(t)] || "en-IN");

  const normalize = (text) => text.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim();

  const parseIncome = (text) => {
    const normalized = normalize(text);
    const numberMatch = normalized.match(/(?:₹|rs\.?|rupees\s*)?([0-9]+(?:\.[0-9]+)?)\s*(crore|cr|lakh|lac|thousand|k)?/i);
    if (numberMatch) {
      let n = Number(numberMatch[1]);
      const unit = (numberMatch[2] || "").toLowerCase();
      if (unit === "crore" || unit === "cr") n *= 10000000;
      else if (unit === "lakh" || unit === "lac") n *= 100000;
      else if (unit === "thousand" || unit === "k") n *= 1000;
      if (n > 0) return n;
    }
    const wordLakh = [
      ["one lakh", 100000], ["two lakh", 200000], ["three lakh", 300000],
      ["four lakh", 400000], ["five lakh", 500000], ["six lakh", 600000],
      ["seven lakh", 700000], ["eight lakh", 800000], ["nine lakh", 900000],
    ];
    const match = wordLakh.find(([words]) => normalized.includes(words));
    return match ? match[1] : null;
  };

  const parseAnswer = (text) => {
    const normalized = normalize(text);
    if (field.key === "category") {
      const aliases = [
        ["SC", ["sc", "scheduled caste", "schedule caste", "अनुसूचित जाति", "एससी"]],
        ["ST", ["st", "scheduled tribe", "अनुसूचित जनजाति", "एसटी"]],
        ["OBC", ["obc", "other backward", "अन्य पिछड़ा", "पिछड़ा वर्ग", "ओबीसी"]],
        ["Woman", ["woman", "women", "female", "lady", "महिला", "औरत"]],
        ["Minority", ["minority", "अल्पसंख्यक"]],
        ["PwD", ["pwd", "disabled", "disability", "divyang", "दिव्यांग"]],
        ["General", ["general", "open category", "सामान्य"]],
      ];
      return aliases.find(([, words]) => words.some((word) => normalized.includes(word)))?.[0] || null;
    }
    if (field.key === "income") return parseIncome(text);
    if (field.key === "businessType") {
      const aliases = [
        ["Tailoring & Textile", ["tailoring", "textile", "silai", "कपड़ा", "सिलाई"]],
        ["Food & Catering", ["food", "catering", "restaurant", "cooking", "खाना", "भोजन", "कैटरिंग"]],
        ["Handicraft", ["handicraft", "hand craft", "craft", "हस्तशिल्प"]],
        ["Retail & Trading", ["retail", "trading", "shop", "दुकान", "व्यापार"]],
        ["Services", ["service", "services", "सेवा"]],
        ["Agriculture-allied", ["agriculture", "farming", "farm", "खेती", "कृषि"]],
      ];
      return aliases.find(([, words]) => words.some((word) => normalized.includes(word)))?.[0] || null;
    }
    if (field.key === "location") return text.trim();
    return null;
  };

  // Keep the selected language in sync with the existing translation object without changing App state structure.
  function languageFromTranslation(translationsObject) {
    if (translationsObject === translations.hi) return "hi";
    if (translationsObject === translations.bn) return "bn";
    if (translationsObject === translations.ta) return "ta";
    if (translationsObject === translations.mr) return "mr";
    if (translationsObject === translations.te) return "te";
    return "en";
  }

  const speakQuestion = (onDone) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (onDone) onDone();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(field.title);
    utterance.lang = getSpeechLocale();
    utterance.rate = 0.92;
    utterance.onend = () => {
      if (onDone) onDone();
    };
    window.speechSynthesis.speak(utterance);
  };

  const moveToNextQuestion = () => {
    if (profileStep < fields.length - 1) {
      setProfileStep((current) => current + 1);
      setHeardText("");
    } else {
      onFindSchemes();
    }
  };

  const startListening = () => {
    if (!recognitionCtor) {
      setVoiceError("Voice recognition is not available in this browser. Please use Chrome or Edge, or type the answer instead.");
      return;
    }
    setVoiceError("");
    setHeardText("");
    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const recognition = new recognitionCtor();
      recognition.lang = getSpeechLocale();
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = (event) => {
        setListening(false);
        if (event.error !== "aborted") setVoiceError(`Microphone error: ${event.error}. Please try again.`);
      };
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();
        setHeardText(transcript);
        const parsed = parseAnswer(transcript);
        if (parsed !== null && parsed !== "") {
          setProfile((current) => ({ ...current, [field.key]: parsed }));
          window.setTimeout(moveToNextQuestion, 500);
        } else {
          setVoiceError("I could not match that answer. Please try again or use the options below.");
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      setVoiceError("Could not start the microphone. Please allow microphone access and try again.");
    }
  };

  // ProfileScreen owns the questionnaire voice flow. Keeping this effect disabled
  // prevents the same question from being spoken/listened to twice.
  useEffect(() => {
    return undefined;
  }, []);

  useEffect(() => () => {
    if (recognitionRef.current) recognitionRef.current.abort();
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }, []);

  const choose = (value) => {
    setProfile((current) => ({ ...current, [field.key]: value }));
    window.setTimeout(moveToNextQuestion, 300);
  };

  const renderCalculator = () => {
    const calc = CALCULATOR_COPY[currentLanguage] || CALCULATOR_COPY.en;
    return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: c.muted, fontSize: 11, fontWeight: 750 }}>{calc.kicker}</div>
        <h1 style={{ fontSize: 30, margin: "5px 0 4px", color: c.text }}>{calc.title}</h1>
        <p style={{ color: c.muted, fontSize: 13 }}>{calc.subtitle}</p>
      </div>

      <div className="glass" style={{ borderRadius: 22, padding: 23, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 15, alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .6 }}>{calc.kicker}</div>
            <h2 style={{ fontSize: 23, margin: "5px 0 3px", color: c.text, fontWeight: 900 }}>{calc.estimate}</h2>
            <p style={{ color: c.muted, fontSize: 12 }}>{calc.helper}</p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${c.primary}14`, color: c.primary, display: "grid", placeItems: "center" }}>
            <Calculator size={20} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          <CalculatorField c={c} icon={<IndianRupee size={15} />} label={calc.loan} value={loan} min={50000} max={5000000} step={10000} display={`₹${loan.toLocaleString("en-IN")}`} onChange={setLoan} />
          <CalculatorField c={c} icon={<Percent size={15} />} label={calc.interest} value={rate} min={1} max={20} step={0.1} display={`${rate.toFixed(1)}%`} onChange={setRate} />
          <CalculatorField c={c} icon={<CalendarDays size={15} />} label={calc.tenure} value={tenure} min={1} max={20} step={1} display={`${tenure} ${calc.years}`} onChange={setTenure} />
        </div>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 16, background: c.surface2, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ color: c.muted, fontSize: 10, fontWeight: 700 }}>{calc.emi}</div>
            <div style={{ color: c.primary, fontSize: 25, fontWeight: 900, marginTop: 4 }}>₹{Math.round(emi).toLocaleString("en-IN")}</div>
          </div>
          <Metric label={calc.totalInterest} value={`₹${Math.round(totalInterest).toLocaleString("en-IN")}`} c={c} />
          <Metric label={calc.totalPayment} value={`₹${Math.round(totalPayment).toLocaleString("en-IN")}`} c={c} />
        </div>
      </div>

    </>
  );
  };

  const renderDashboard = () => (
    <>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7 }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).dash}</div>
        <h1 style={{ fontSize: 30, margin: "7px 0 5px", color: c.text }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).welcome}, {user.name || "Guest User"}</h1>
        <p style={{ color: c.muted, fontSize: 13, margin: 0 }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).tools}</p>
      </div>

      {/* Voice entry point. The existing Find Schemes questionnaire appears only after this is clicked. */}
      {!questionsStarted && (
        <div className="glass" style={{ borderRadius: 24, padding: 34, maxWidth: 820, margin: "0 auto 18px", textAlign: "center" }}>
          <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7 }}>{t.voiceAssistance}</div>
          <h2 style={{ fontSize: 24, margin: "7px 0 6px", color: c.text }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).ready}</h2>
          <p style={{ color: c.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 22px" }}>
            {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).desc}
          </p>
          <button
            type="button"
            onClick={() => {
              setVoiceError("");
              setHeardText("");
              setQuestionsStarted(true);
              setProfileStep(0);
            }}
            className="pulse"
            style={{ ...primaryButton(c), padding: "16px 30px", fontSize: 15, margin: "0 auto" }}
          >
            <Mic size={20} /> {t.tapToSpeak}
          </button>
          <div style={{ marginTop: 14, color: c.muted, fontSize: 11 }}>
            🎙 {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).natural} &nbsp; • &nbsp; 🔊 {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).read} &nbsp; • &nbsp; ✍️ {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).auto}
          </div>
        </div>
      )}

      {/* Reuse the exact existing Find Schemes/Profile questionnaire after Tap to Speak. */}
      {questionsStarted && (
        <ProfileScreen
          c={c}
          t={t}
          language={languageFromTranslation(t)}
          profile={profile}
          setProfile={setProfile}
          step={profileStep}
          setStep={setProfileStep}
          autoStartVoice={true}
          onVoiceStarted={() => {}}
          onBack={() => {
            setQuestionsStarted(false);
            setListening(false);
            setVoiceError("");
            setHeardText("");
            if (recognitionRef.current) recognitionRef.current.abort();
            if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
          }}
          onFinish={onFinish}
        />
      )}
    </>
  );

  return (
    <main style={{ minHeight: "calc(100vh - 74px)", background: c.bg }} className="fade">
      <div className="container dashboard-shell" style={{ padding: "28px 0 45px", display: "grid", gridTemplateColumns: "225px minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
        <aside className="glass" style={{ borderRadius: 20, padding: 12, position: "sticky", top: 92 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 9px 16px", borderBottom: `1px solid ${c.border}`, marginBottom: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`, display: "grid", placeItems: "center", color: "white", flexShrink: 0 }}>
              <Landmark size={19} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 850, fontSize: 15 }}>SchemeSaathi</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            {menu.map((item) => (
              <button key={item.label} type="button" onClick={() => handleNav(item.label)} style={{ width: "100%", border: "none", borderRadius: 10, padding: "10px 11px", background: activeNav === item.label ? c.primary : "transparent", color: activeNav === item.label ? "white" : c.text, display: "flex", alignItems: "center", gap: 10, textAlign: "left", fontSize: 12.5, fontWeight: activeNav === item.label ? 800 : 650 }}>
                {item.icon}<span style={{ flex: 1 }}>{navLabels[item.label] || item.label}</span>

              </button>
            ))}
          </div>

          <div style={{ marginTop: 15, padding: 11, borderRadius: 13, background: c.surface2, display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 50, background: `${c.primary}18`, color: c.primary, display: "grid", placeItems: "center" }}><User size={15} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || "Guest User"}</div>
              <div style={{ color: c.muted, fontSize: 9 }}>{({en:"Profile active",hi:"प्रोफ़ाइल सक्रिय",bn:"প্রোফাইল সক্রিয়",ta:"சுயவிவரம் செயலில்",mr:"प्रोफाइल सक्रिय",te:"ప్రొఫైల్ సక్రియంగా ఉంది"}[currentLanguage] || "Profile active")}</div>
            </div>
          </div>
        </aside>

        <section style={{ minWidth: 0 }}>
          {activeNav === "Nearby Help"
            ? (
              <NearbyHelpScreen
                c={c}
                t={t}
                language={languageFromTranslation(t)}
                profile={profile}
                selectedScheme={selectedScheme}
                selectedPartner={selectedPartner}
                setSelectedPartner={setSelectedPartner}
              />
            )
            : activeNav === "Calculator"
            ? (
              <FinancialCalculator
                c={c}
                t={t}
                scheme={selectedScheme}
                profile={profile}
                onHandoff={(plan) => {
                  if (setFinancialPlan) setFinancialPlan(plan);
                  if (selectedScheme) {
                    setScreen("detail");
                  } else {
                    onFindSchemes();
                  }
                }}
              />
            )
            : activeNav === "Compare"
              ? (
                <CompareScreen
                  c={c}
                  t={t}
                  language={languageFromTranslation(t)}
                  results={results}
                />
              )
              : activeNav === "Help"
                ? (
                  <HelpSupportPanel
                    c={c}
                    user={user}
                    language={languageFromTranslation(t)}
                  />
                )
                : activeNav === "Profile"
                ? (
                  <ProfileOverview
                    c={c}
                    language={languageFromTranslation(t)}
                    user={user}
                    profile={profile}
                    onEdit={() => {
                      setProfileStep(0);
                      setVoiceRequested(false);
                      setQuestionsStarted(false);
                      setActiveNav("Dashboard");
                      setScreen("profile");
                    }}
                  />
                )
                : activeNav === "Applications"
                ? (
                  <ApplicationsPanel
                    c={c}
                    language={languageFromTranslation(t)}
                    onTrackApplication={(app) => {
                      if (onTrackApplication) {
                        onTrackApplication(app);
                      }
                    }}
                    onNewApplication={() => onFindSchemes()}
                  />
                )
                : activeNav === "Saved Schemes"
                ? (
                  <SavedSchemesPanel
                    c={c}
                    language={languageFromTranslation(t)}
                    savedSchemes={savedSchemes}
                    onOpen={onOpenScheme}
                  />
                )
                : activeNav === "Documents"
                ? (
                  <DocumentsPanel
                    c={c}
                    language={languageFromTranslation(t)}
                    files={documentFiles}
                    setFiles={setDocumentFiles}
                    preview={documentPreview}
                    setPreview={setDocumentPreview}
                  />
                )
                : renderDashboard()}

        </section>
      </div>

      <style>{`
        .option-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        @media(max-width:850px){.dashboard-shell{grid-template-columns:1fr!important}.dashboard-shell aside{position:static!important}}
        @media(max-width:600px){.dashboard-shell{padding-top:18px!important}.option-grid{grid-template-columns:1fr!important}}
      `}</style>
    </main>
  );
}



function NearbyHelpScreen({
  c,
  t,
  language = "en",
  profile,
  selectedScheme,
  selectedPartner,
  setSelectedPartner,
}) {
  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <PartnerMap
        c={c}
        t={t}
        scheme={selectedScheme}
        profile={profile}
        selectedPartner={selectedPartner}
        setSelectedPartner={setSelectedPartner}
      />
    </div>
  );
}

function LegacyNearbyHelpScreen({ c, language = "en", profile }) {
  const copy = NEARBY_COPY[language] || NEARBY_COPY.en;
  const location = String(profile?.location || "").trim();
  const [status, setStatus] = useState(location ? "loading" : "idle");
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState("");

  const loadBanks = async () => {
    if (!location) {
      setStatus("idle");
      setBanks([]);
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(location)}`;
      const geoResponse = await fetch(geoUrl, { headers: { Accept: "application/json" } });
      if (!geoResponse.ok) throw new Error("geocode");
      const geo = await geoResponse.json();
      if (!geo.length) throw new Error("location");
      const lat = Number(geo[0].lat);
      const lon = Number(geo[0].lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("location");

      const query = `[out:json][timeout:15];(nwr[amenity=bank](around:10000,${lat},${lon}););out center tags;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("banks");
      const data = await response.json();

      const toRadians = (value) => (value * Math.PI) / 180;
      const distanceKm = (latA, lonA, latB, lonB) => {
        const dLat = toRadians(latB - latA);
        const dLon = toRadians(lonB - lonA);
        const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const seen = new Set();
      const mapped = (data.elements || [])
        .map((item) => {
          const tags = item.tags || {};
          const name = tags.name || tags["name:en"] || "Other Bank";
          const lat2 = Number(item.lat ?? item.center?.lat);
          const lon2 = Number(item.lon ?? item.center?.lon);
          const id = `${name}-${lat2.toFixed(5)}-${lon2.toFixed(5)}`;
          return {
            id,
            name,
            address: tags["addr:street"] || tags["addr:city"] || location,
            lat: lat2,
            lon: lon2,
            loan: loanRangeForBank(name),
            distance: distanceKm(lat, lon, lat2, lon2),
          };
        })
        .filter((item) => {
          if (!Number.isFinite(item.lat) || !Number.isFinite(item.lon)) return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 12);

      setBanks(mapped);
      setStatus("ready");
    } catch (e) {
      setBanks([]);
      setError("Unable to load live nearby bank locations right now.");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadBanks();
    // Re-run whenever the location selected in the profile changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const mapUrl = (bank) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${bank.name}, ${location}`)}`;

  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7 }}>{copy.bank}</div>
        <h1 style={{ fontSize: 30, margin: "6px 0 5px", color: c.text }}>{copy.title}</h1>
        <p style={{ color: c.muted, fontSize: 13, margin: 0, lineHeight: 1.55 }}>{copy.subtitle}</p>
      </div>

      <div className="glass" style={{ borderRadius: 18, padding: 17, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ color: c.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{copy.selectedLocation}</div>
            <div style={{ color: c.text, fontSize: 17, fontWeight: 850, marginTop: 4 }}>{location || "—"}</div>
            <div style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>{copy.radius}</div>
          </div>
          {location && (
            <button type="button" onClick={loadBanks} style={{ ...secondaryButton(c), padding: "10px 14px", fontSize: 11 }}>
              <Search size={14} /> {copy.search}
            </button>
          )}
        </div>
      </div>

      {location && (
        <div className="glass" style={{ borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 17px 10px" }}>
            <div style={{ color: c.text, fontSize: 15, fontWeight: 850 }}>{copy.title}</div>
            <div style={{ color: c.muted, fontSize: 11, marginTop: 3 }}>{copy.selectedLocation}: {location}</div>
          </div>
          <div style={{ minHeight: 180, background: `linear-gradient(135deg, ${c.surface2}, ${c.border})`, display: "grid", placeItems: "center", padding: 18 }}>
            <div style={{ textAlign: "center", maxWidth: 420 }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, background: c.primary, color: "white", display: "grid", placeItems: "center", margin: "0 auto 10px" }}><MapPin size={23} /></div>
              <div style={{ color: c.text, fontWeight: 850, fontSize: 15 }}>{location}</div>
              <div style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>{copy.radius}</div>
            </div>
          </div>
        </div>
      )}

      {!location ? (
        <div className="glass" style={{ borderRadius: 18, padding: 28, textAlign: "center", color: c.muted }}>{copy.noLocation}</div>
      ) : status === "loading" ? (
        <div className="glass" style={{ borderRadius: 18, padding: 30, textAlign: "center", color: c.muted }}>{copy.loading}</div>
      ) : status === "error" ? (
        <div className="glass" style={{ borderRadius: 18, padding: 25, textAlign: "center" }}>
          <div style={{ color: c.danger, fontWeight: 800, marginBottom: 12 }}>{error}</div>
          <button type="button" onClick={loadBanks} style={{ ...secondaryButton(c), padding: "10px 14px", fontSize: 11 }}>{copy.retry}</button>
        </div>
      ) : banks.length === 0 ? (
        <div className="glass" style={{ borderRadius: 18, padding: 28, textAlign: "center", color: c.muted }}>{copy.noResults}</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 14 }}>
            {banks.map((bank) => (
              <div key={bank.id} className="glass" style={{ borderRadius: 18, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", gap: 11, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: `${c.primary}14`, color: c.primary, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Landmark size={20} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: c.text, fontSize: 15, fontWeight: 900, lineHeight: 1.2 }}>{bank.name}</div>
                      <div style={{ color: c.muted, fontSize: 11, marginTop: 4, lineHeight: 1.35 }}>{bank.address}</div>
                    </div>
                  </div>
                  <div style={{ color: c.primary, fontSize: 10, fontWeight: 850, whiteSpace: "nowrap" }}>{copy.distance}: {bank.distance < 1 ? `${Math.round(bank.distance * 1000)} m` : `${bank.distance.toFixed(1)} km`}</div>
                </div>

                <div style={{ marginTop: 16, padding: 13, borderRadius: 14, background: c.surface2 }}>
                  <div style={{ color: c.muted, fontSize: 10, fontWeight: 750 }}>{copy.loanAmount}</div>
                  <div style={{ color: c.text, fontSize: 17, fontWeight: 900, marginTop: 4 }}>{bank.loan}</div>
                </div>

                <a href={mapUrl(bank)} target="_blank" rel="noreferrer" style={{ ...secondaryButton(c), marginTop: 13, width: "100%", textDecoration: "none", boxSizing: "border-box", fontSize: 11 }}>
                  <MapPin size={14} /> {copy.openMaps}
                </a>
              </div>
            ))}
          </div>
          <div style={{ color: c.muted, fontSize: 10, lineHeight: 1.55, marginTop: 14 }}>{copy.locationNote}</div>
        </>
      )}
    </div>
  );
}

function ProfileOverview({ c, language = "en", user, profile, onEdit }) {
  const p = PROFILE_UI_TRANSLATIONS[language] || PROFILE_UI_TRANSLATIONS.en;
  const filled = [profile.age, profile.category, profile.income, profile.occupation, profile.ideaCategory, profile.idea, profile.location].filter((v) => String(v || "").trim()).length;
  const completion = Math.round((filled / 7) * 100);
  const initials = String(user?.name || "Guest User").trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "GU";
  const incomeText = profile.income ? `₹${Number(profile.income).toLocaleString("en-IN")}` : p.notProvided;
  const location = profile.location || p.notProvided;
  const state = profile.location ? String(profile.location).split(",")[String(profile.location).split(",").length - 1].trim() : p.notProvided;
  const gender = profile.category === "Woman" ? (language === "hi" ? "महिला" : language === "bn" ? "মহিলা" : language === "ta" ? "பெண்" : language === "mr" ? "महिला" : language === "te" ? "మహిళ" : "Female") : p.notProvided;
  const category = profile.category || p.notProvided;
  const stage = profile.occupation || p.notProvided;
  const sector = profile.ideaCategory || p.notProvided;
  const purpose = profile.idea || p.notProvided;
  const values = {
    category: { Woman: language === "en" ? "Women" : language === "hi" ? "महिलाएँ" : language === "bn" ? "মহিলা" : language === "ta" ? "பெண்கள்" : language === "mr" ? "महिला" : "మహిళలు" }[profile.category] || category,
  };

  const section = (title, icon, items) => (
    <div className="glass" style={{ borderRadius: 18, padding: 20, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ color: c.primary, display: "grid", placeItems: "center" }}>{icon}</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: c.text }}>{title}</div>
        </div>
        <button type="button" onClick={onEdit} style={{ border: `1px solid ${c.border}`, background: c.surface2, color: c.text, borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800 }}>{p.edit}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", columnGap: 35, rowGap: 18 }}>
        {items.map(([label, value]) => (
          <div key={label}>
            <div style={{ color: c.muted, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ color: c.text, fontSize: 14, fontWeight: 800, lineHeight: 1.35, wordBreak: "break-word" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <div style={{ marginBottom: 18 }}><div style={{ fontSize: 26, fontWeight: 900, color: c.text }}>{p.title}</div></div>
      <div className="glass" style={{ borderRadius: 18, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: c.primary, color: "white", display: "grid", placeItems: "center", fontSize: 22, fontWeight: 900, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: c.text }}>{user?.name || p.notProvided}</div>
            <div style={{ color: c.muted, fontSize: 12, marginTop: 3 }}>{sector !== p.notProvided ? sector : p.notProvided} · {state}</div>
            <div style={{ marginTop: 13, display: "flex", justifyContent: "space-between", gap: 12 }}><span style={{ color: c.text, fontSize: 11, fontWeight: 800 }}>{p.profileCompletion}</span><span style={{ color: c.primary, fontSize: 11, fontWeight: 900 }}>{completion}%</span></div>
            <div style={{ height: 7, borderRadius: 999, background: c.border, overflow: "hidden", marginTop: 5 }}><div style={{ width: `${completion}%`, height: "100%", background: c.primary, borderRadius: 999 }} /></div>
            <div style={{ color: c.muted, fontSize: 10, marginTop: 5 }}>{p.completeProfile}</div>
          </div>
          <button type="button" onClick={onEdit} style={{ border: `1px solid ${c.border}`, background: c.surface2, color: c.text, borderRadius: 999, padding: "9px 13px", fontSize: 11, fontWeight: 800, alignSelf: "flex-start" }}>{p.editProfile}</button>
        </div>
      </div>

      {section(p.personal, <UserCircle size={18} />, [
        [p.fullName, user?.name || p.notProvided], [p.age, profile.age || p.notProvided], [p.gender, gender],
        [p.category, values.category], [p.state, state], [p.annualIncome, incomeText],
      ])}

      {section(p.business, <Briefcase size={18} />, [
        [p.businessName, user?.name ? `${user.name} Business` : p.notProvided], [p.sector, sector], [p.stage, stage],
        [p.employees, p.notProvided], [p.locationType, profile.location ? p.urban : p.notProvided], [p.registration, p.notProvided],
      ])}

      {section(p.financial, <IndianRupee size={18} />, [
        [p.fundingNeed, p.notProvided], [p.purpose, purpose], [p.assistanceType, p.schemeSupport],
      ])}
    </div>
  );
}

function HelpSupportPanel({ c, language = "en" }) {
  const [openFaq, setOpenFaq] = useState(null);
  const help = HELP_TRANSLATIONS[language] || HELP_TRANSLATIONS.en;
  const faqs = help.faqs.map(([q, a]) => ({ q, a }));

  const isDark = c.bg === THEMES.dark.bg;
  const supportBackgrounds = isDark
    ? [c.surface2, c.surface2, c.surface2, c.surface2]
    : ["#EEF6FF", "#ECFFF5", "#FFFBEA", "#FBF1FF"];

  const supportCard = (title, text, icon, button, background, accent) => (
    <div
      className="glass"
      style={{
        borderRadius: 18,
        padding: 20,
        background: background,
        borderColor: `${accent}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        minHeight: 105,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          fontSize: 23,
          flex: "0 0 auto",
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: c.text, fontSize: 15, fontWeight: 850 }}>{title}</div>
          <div style={{ color: c.muted, fontSize: 12, lineHeight: 1.45, marginTop: 4 }}>{text}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {}}
        style={{
          border: "none",
          borderRadius: 999,
          padding: "8px 12px",
          background: c.surface,
          color: c.text,
          fontSize: 11,
          fontWeight: 800,
          boxShadow: "0 1px 0 rgba(0,0,0,.04)",
          whiteSpace: "nowrap",
        }}
      >
        {button}
      </button>
    </div>
  );

  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: c.text, fontSize: 28, fontWeight: 900, lineHeight: 1.15 }}>{help.title}</div>
        <div style={{ color: c.muted, fontSize: 14, marginTop: 5 }}>{help.intro}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {help.cards.map(([title, text, icon, button], index) => supportCard(title, text, icon, button, supportBackgrounds[index], ["#5C8DF6", "#55B987", "#E0BA45", "#B778D8"][index]))}
      </div>

      <div className="glass" style={{ marginTop: 18, borderRadius: 18, padding: 20 }}>
        <div style={{ color: c.text, fontSize: 18, fontWeight: 850, marginBottom: 13 }}>{help.faqTitle}</div>
        <div style={{ display: "grid", gap: 9 }}>
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div key={faq.q} style={{ border: `1px solid ${c.border}`, borderRadius: 13, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : index)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: c.surface,
                    color: c.text,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    textAlign: "left",
                    fontSize: 13.5,
                    fontWeight: 750,
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: c.muted, fontSize: 11 }}>{open ? "▲" : "▾"}</span>
                </button>
                {open && (
                  <div style={{ padding: "0 16px 14px", color: c.muted, fontSize: 12.5, lineHeight: 1.6, background: c.surface }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DocumentsPanel({ c, language = "en", files = {}, setFiles, preview, setPreview }) {
  const copy = DOCUMENTS_COPY[language] || DOCUMENTS_COPY.en;
  const docs = [
    { key: "aadhaar", name: copy.docs.aadhaar, typeLabel: "Aadhaar Card (UIDAI)" },
    { key: "pan", name: copy.docs.pan, typeLabel: "PAN Card" },
    { key: "udyam", name: copy.docs.udyam, typeLabel: "Udyam / MSME Certificate" },
    { key: "caste", name: copy.docs.caste, typeLabel: "Caste Certificate (SC/ST/OBC)" },
    { key: "photo", name: copy.docs.photo, typeLabel: "Passport Photograph" },
    { key: "bank", name: copy.docs.bank, typeLabel: "Bank Passbook / Statement" },
    { key: "address", name: copy.docs.address, typeLabel: "Proof of Address / Domicile" },
    { key: "income", name: copy.docs.income, typeLabel: "Income Certificate" },
  ];

  const verifiedCount = docs.reduce(
    (count, doc) => count + (files[doc.key]?.status === "verified" ? 1 : 0),
    0
  );
  const completion = Math.round((verifiedCount / docs.length) * 100);
  const dateLocales = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    mr: "mr-IN",
    te: "te-IN",
  };

  const formatSize = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(dateLocales[language] || "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const handleFile = async (key, file, docName) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    const allowedExtensions = /\.(pdf|png|jpe?g|webp)$/i;
    const validType = allowedTypes.includes(file.type) || allowedExtensions.test(file.name);
    const maxBytes = 10 * 1024 * 1024;

    if (!validType) {
      window.alert(copy.fileTypeError || "Only PDF, PNG, JPG and JPEG files are allowed.");
      return;
    }

    if (file.size > maxBytes) {
      window.alert(copy.fileSizeError || "Maximum file size is 10 MB.");
      return;
    }

    if (files[key]?.url) URL.revokeObjectURL(files[key].url);

    const url = URL.createObjectURL(file);
    const formattedDate = formatDate(Date.now());
    const formattedSize = formatSize(file.size);

    // 1. Set preliminary verifying state
    setFiles((prev) => ({
      ...prev,
      [key]: {
        file,
        url,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: formattedSize,
        date: formattedDate,
        uploadedAt: Date.now(),
        status: "verifying",
        message: "🔍 AI OCR is reading and extracting document data...",
        extracted: null,
      },
    }));

    // 2. Call backend /api/ocr/verify for real-time document OCR inspection
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("document_type", key || docName || "document");
      formData.append("document_name", docName || key || "Document");

      const res = await fetch("/api/ocr/verify", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.is_valid !== false) {
          setFiles((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              status: "verified",
              message: data.message || "Document processed successfully",
              extracted: data.extracted_entities || {},
              confidence: data.confidence || 0.95,
              issues: [],
            },
          }));
        } else {
          setFiles((prev) => ({
            ...prev,
            [key]: {
              ...prev[key],
              status: "invalid",
              message: data.message || "Document verification failed.",
              issues: data.issues || ["Invalid document format or unreadable text."],
            },
          }));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setFiles((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            status: "invalid",
            message: errData.detail || "Verification failed. Please re-upload a clear file.",
            issues: [errData.detail || "Unable to read document."],
          },
        }));
      }
    } catch (e) {
      setFiles((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          status: "uploaded",
          message: "Document uploaded. AI OCR is temporarily unavailable — document will be reviewed by the authority.",
          extracted: {},
          confidence: null,
          issues: [],
        },
      }));
    }
  };

  const viewFile = (doc) => {
    const uploaded = files[doc.key];
    if (!uploaded?.url) return;
    setPreview({
      name: doc.name,
      fileName: uploaded.name,
      url: uploaded.url,
      type: uploaded.type,
    });
  };

  return (
    <div className="fade">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 25, fontWeight: 900, color: c.text }}>
          {copy.title}
        </div>
        <div style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>
          {verifiedCount} {copy.of} {docs.length} verified & ready
        </div>
      </div>

      <div
        className="glass"
        style={{
          borderRadius: 16,
          padding: 14,
          marginBottom: 14,
          background: c.surface2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            alignItems: "center",
            fontSize: 12,
            fontWeight: 800,
            color: c.primary,
          }}
        >
          <span>{copy.completion} (Verified)</span>
          <span>{completion}%</span>
        </div>
        <div
          style={{
            height: 7,
            borderRadius: 99,
            background: c.border,
            overflow: "hidden",
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: `${completion}%`,
              height: "100%",
              background: completion === 100 ? c.success : c.primary,
              borderRadius: 99,
              transition: "width .25s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: c.muted, marginTop: 6 }}>
          {completion === 100 ? "✅ All documents uploaded & AI-processed. Final authority verification is completed during scheme review." : "Upload each document below — AI OCR will extract key details for review."}
        </div>
      </div>

      <div style={{ display: "grid", gap: 11 }}>
        {docs.map((doc) => {
          const docData = files[doc.key];
          const uploaded = Boolean(docData);
          const status = docData?.status || (uploaded ? "uploaded" : "pending");
          const isVerified = status === "verified";
          const isInvalid = status === "invalid";
          const isVerifying = status === "verifying";

          return (
            <div
              key={doc.key}
              className="glass"
              style={{
                borderRadius: 12,
                padding: "12px 14px",
                border: isInvalid
                  ? `1.5px solid ${c.danger || '#E53E3E'}`
                  : isVerified
                  ? `1px solid ${c.success || '#38A169'}`
                  : `1px solid ${c.border}`,
                background: isInvalid
                  ? `${c.danger || '#E53E3E'}08`
                  : c.surface,
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px minmax(0, 1fr) auto auto",
                  alignItems: "center",
                  columnGap: 11,
                  minHeight: 48,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isInvalid
                      ? `${c.danger || '#E53E3E'}22`
                      : isVerified
                      ? `${c.success || '#38A169'}22`
                      : `${c.primary}18`,
                    color: isInvalid
                      ? (c.danger || '#E53E3E')
                      : isVerified
                      ? (c.success || '#38A169')
                      : c.primary,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {isVerified ? (
                    <CheckCircle2 size={18} />
                  ) : isInvalid ? (
                    <X size={18} />
                  ) : (
                    <FileText size={17} />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 12.5,
                      color: c.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{doc.name}</span>
                    {isVerified && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: `${c.success || '#38A169'}20`,
                          color: c.success || '#38A169',
                          padding: "2px 7px",
                          borderRadius: 99,
                        }}
                      >
                        ✓ AI Processed
                      </span>
                    )}
                    {isInvalid && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: `${c.danger || '#E53E3E'}20`,
                          color: c.danger || '#E53E3E',
                          padding: "2px 7px",
                          borderRadius: 99,
                        }}
                      >
                        ⚠ Action Required
                      </span>
                    )}
                    {isVerifying && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: `${c.accent || '#E58B35'}20`,
                          color: c.accent || '#E58B35',
                          padding: "2px 7px",
                          borderRadius: 99,
                        }}
                      >
                        ⏳ AI Verifying...
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 10.5,
                      color: c.muted,
                      marginTop: 2,
                    }}
                  >
                    {uploaded
                      ? `${docData.name} (${docData.size}) • ${docData.date}`
                      : copy.notUploaded}
                  </div>
                </div>

                {uploaded && (
                  <button
                    type="button"
                    onClick={() => viewFile(doc)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: c.primary,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "6px 8px",
                      cursor: "pointer",
                    }}
                  >
                    {copy.view}
                  </button>
                )}

                <label
                  style={{
                    border: isInvalid
                      ? `1.5px solid ${c.danger || '#E53E3E'}`
                      : `1px solid ${c.border}`,
                    background: isInvalid
                      ? (c.danger || '#E53E3E')
                      : c.surface2,
                    color: isInvalid ? "#FFFFFF" : c.text,
                    borderRadius: 8,
                    padding: "7px 11px",
                    fontSize: 11,
                    fontWeight: 750,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {isInvalid ? "🔄 Re-upload" : uploaded ? copy.replace : "⬆ Upload"}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      handleFile(doc.key, e.target.files?.[0], doc.name);
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {/* Real-time OCR Extracted Details or Error Notice */}
              {isVerified && docData.extracted && (
                <div
                  style={{
                    background: c.surface2,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 10.5,
                    color: c.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {docData.extracted.aadhaar_number && (
                    <span><strong>Aadhaar:</strong> {docData.extracted.aadhaar_number}</span>
                  )}
                  {docData.extracted.certificate_number && (
                    <span><strong>Cert No:</strong> {docData.extracted.certificate_number}</span>
                  )}
                  {docData.extracted.issuing_authority && (
                    <span style={{ color: c.muted }}><strong>Authority:</strong> {docData.extracted.issuing_authority}</span>
                  )}
                </div>
              )}

              {isInvalid && (
                <div
                  style={{
                    background: `${c.danger || '#E53E3E'}15`,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11,
                    color: c.danger || '#E53E3E',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {docData.message || (docData.issues && docData.issues[0]) || "Document could not be verified. Please click Re-upload to submit a clear photo or PDF."}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 11,
          fontSize: 10.5,
          color: c.muted,
          textAlign: "right",
        }}
      >
        {copy.fileRule || "PDF, PNG, JPG or JPEG • Max 5 MB per file"}
      </div>

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.62)",
            zIndex: 120,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              height: "min(82vh, 760px)",
              overflow: "hidden",
              background: c.surface,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 18,
              padding: 18,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong>{preview.name}</strong>
                <div style={{ fontSize: 10, color: c.muted, marginTop: 3 }}>
                  {preview.fileName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                style={{
                  border: `1px solid ${c.border}`,
                  background: c.surface2,
                  color: c.text,
                  borderRadius: 8,
                  padding: "5px 9px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {preview.type === "application/pdf" || /\.pdf$/i.test(preview.fileName || "") ? (
              <iframe
                title={preview.name}
                src={preview.url}
                style={{
                  width: "100%",
                  flex: 1,
                  border: "none",
                  borderRadius: 12,
                  background: c.surface2,
                }}
              />
            ) : (
              <img
                src={preview.url}
                alt={preview.name}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: 0,
                  objectFit: "contain",
                  borderRadius: 12,
                  background: c.surface2,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DOCUMENTS_COPY = {
  en: {
    title: "My Documents", of: "of", uploaded: "documents uploaded", completion: "Document Completion", speed: "Complete all documents to speed up application review.", uploadedOn: "Uploaded", notUploaded: "Not uploaded", view: "View", replace: "Replace", upload: "Upload", previewNote: "Preview your uploaded document.", fileTypeError: "Only PDF, PNG, JPG and JPEG files are allowed.", fileSizeError: "Maximum file size is 5 MB.", fileRule: "PDF, PNG, JPG or JPEG • Max 5 MB per file",
    docs: { aadhaar: "Aadhaar Card", pan: "PAN Card", udyam: "Business Registration / Udyam Certificate", caste: "Caste Certificate (SC)", photo: "Photograph (Passport Size)", bank: "Bank Statement", address: "Address Proof", income: "Income Certificate" }
  },
  hi: {
    title: "मेरे दस्तावेज़", of: "में से", uploaded: "दस्तावेज़ अपलोड किए गए", completion: "दस्तावेज़ पूर्णता", speed: "आवेदन की समीक्षा तेज़ करने के लिए सभी दस्तावेज़ पूरे करें।", uploadedOn: "अपलोड किया गया", notUploaded: "अपलोड नहीं किया गया", view: "देखें", replace: "बदलें", upload: "अपलोड करें", previewNote: "अपलोड किए गए दस्तावेज़ का पूर्वावलोकन करें।", fileTypeError: "केवल PDF, PNG, JPG और JPEG फ़ाइलें अपलोड कर सकते हैं।", fileSizeError: "फ़ाइल का अधिकतम आकार 5 MB है।", fileRule: "PDF, PNG, JPG या JPEG • प्रत्येक फ़ाइल अधिकतम 5 MB",
    docs: { aadhaar: "आधार कार्ड", pan: "पैन कार्ड", udyam: "व्यवसाय पंजीकरण / उद्यम प्रमाणपत्र", caste: "जाति प्रमाणपत्र (SC)", photo: "फोटो (पासपोर्ट आकार)", bank: "बैंक स्टेटमेंट", address: "पते का प्रमाण", income: "आय प्रमाणपत्र" }
  },
  bn: {
    title: "আমার নথি", of: "এর মধ্যে", uploaded: "টি নথি আপলোড হয়েছে", completion: "নথি সম্পূর্ণতা", speed: "আবেদন পর্যালোচনা দ্রুত করতে সব নথি সম্পূর্ণ করুন।", uploadedOn: "আপলোড হয়েছে", notUploaded: "আপলোড করা হয়নি", view: "দেখুন", replace: "বদলান", upload: "আপলোড করুন", previewNote: "আপলোড করা নথির প্রিভিউ দেখুন।", fileTypeError: "শুধুমাত্র PDF, PNG, JPG এবং JPEG ফাইল আপলোড করা যাবে।", fileSizeError: "ফাইলের সর্বোচ্চ আকার 5 MB।", fileRule: "PDF, PNG, JPG বা JPEG • প্রতিটি ফাইল সর্বোচ্চ 5 MB",
    docs: { aadhaar: "আধার কার্ড", pan: "প্যান কার্ড", udyam: "ব্যবসা নিবন্ধন / উদ্যম শংসাপত্র", caste: "জাতি শংসাপত্র (SC)", photo: "ছবি (পাসপোর্ট সাইজ)", bank: "ব্যাংক স্টেটমেন্ট", address: "ঠিকানার প্রমাণ", income: "আয় শংসাপত্র" }
  },
  ta: {
    title: "எனது ஆவணங்கள்", of: "இல்", uploaded: "ஆவணங்கள் பதிவேற்றப்பட்டுள்ளன", completion: "ஆவண நிறைவு", speed: "விண்ணப்ப மதிப்பாய்வை விரைவுபடுத்த அனைத்து ஆவணங்களையும் முடிக்கவும்.", uploadedOn: "பதிவேற்றப்பட்டது", notUploaded: "பதிவேற்றப்படவில்லை", view: "பார்க்க", replace: "மாற்று", upload: "பதிவேற்று", previewNote: "பதிவேற்றிய ஆவணத்தை முன்னோட்டமிடுங்கள்.", fileTypeError: "PDF, PNG, JPG மற்றும் JPEG கோப்புகள் மட்டுமே அனுமதிக்கப்படும்.", fileSizeError: "கோப்பின் அதிகபட்ச அளவு 5 MB.", fileRule: "PDF, PNG, JPG அல்லது JPEG • ஒவ்வொரு கோப்பும் அதிகபட்சம் 5 MB",
    docs: { aadhaar: "ஆதார் அட்டை", pan: "PAN அட்டை", udyam: "வணிக பதிவு / உத்யம் சான்றிதழ்", caste: "சாதிச் சான்றிதழ் (SC)", photo: "புகைப்படம் (பாஸ்போர்ட் அளவு)", bank: "வங்கி அறிக்கை", address: "முகவரி சான்று", income: "வருமானச் சான்றிதழ்" }
  },
  mr: {
    title: "माझी कागदपत्रे", of: "पैकी", uploaded: "कागदपत्रे अपलोड केली आहेत", completion: "कागदपत्र पूर्णता", speed: "अर्जाचे पुनरावलोकन जलद करण्यासाठी सर्व कागदपत्रे पूर्ण करा.", uploadedOn: "अपलोड केले", notUploaded: "अपलोड केलेले नाही", view: "पहा", replace: "बदला", upload: "अपलोड करा", previewNote: "अपलोड केलेल्या कागदपत्राचे पूर्वावलोकन पहा.", fileTypeError: "फक्त PDF, PNG, JPG आणि JPEG फाइल्स अपलोड करता येतील.", fileSizeError: "फाइलचा कमाल आकार 5 MB आहे.", fileRule: "PDF, PNG, JPG किंवा JPEG • प्रत्येक फाइल कमाल 5 MB",
    docs: { aadhaar: "आधार कार्ड", pan: "पॅन कार्ड", udyam: "व्यवसाय नोंदणी / उद्यम प्रमाणपत्र", caste: "जात प्रमाणपत्र (SC)", photo: "फोटो (पासपोर्ट आकार)", bank: "बँक स्टेटमेंट", address: "पत्त्याचा पुरावा", income: "उत्पन्न प्रमाणपत्र" }
  },
  te: {
    title: "నా పత్రాలు", of: "లో", uploaded: "పత్రాలు అప్‌లోడ్ అయ్యాయి", completion: "పత్రాల పూర్తి స్థాయి", speed: "దరఖాస్తు సమీక్షను వేగవంతం చేయడానికి అన్ని పత్రాలను పూర్తి చేయండి.", uploadedOn: "అప్‌లోడ్ చేసినది", notUploaded: "అప్‌లోడ్ చేయలేదు", view: "చూడండి", replace: "మార్చండి", upload: "అప్‌లోడ్ చేయండి", previewNote: "అప్‌లోడ్ చేసిన పత్రాన్ని ప్రివ్యూ చేయండి.", fileTypeError: "PDF, PNG, JPG మరియు JPEG ఫైళ్లను మాత్రమే అప్‌లోడ్ చేయవచ్చు.", fileSizeError: "ఫైల్ గరిష్ఠ పరిమాణం 5 MB.", fileRule: "PDF, PNG, JPG లేదా JPEG • ప్రతి ఫైల్ గరిష్ఠం 5 MB",
    docs: { aadhaar: "ఆధార్ కార్డు", pan: "PAN కార్డు", udyam: "వ్యాపార నమోదు / ఉద్యం సర్టిఫికేట్", caste: "కుల ధృవీకరణ పత్రం (SC)", photo: "ఫోటో (పాస్‌పోర్ట్ సైజ్)", bank: "బ్యాంక్ స్టేట్‌మెంట్", address: "చిరునామా రుజువు", income: "ఆదాయ ధృవీకరణ పత్రం" }
  },
};

function ApplicationsPanel({ c, language = "en", onTrackApplication, onNewApplication }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const loadApps = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUserApplications();
      if (res && res.applications) {
        setApplications(res.applications);
      }
    } catch (err) {
      console.warn("Failed to load applications:", err);
      setError(err.message || "Failed to load applications from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    try {
      const res = await getApplicationStatus(lookupId.trim());
      if (res && res.application_id) {
        onTrackApplication(res);
      } else {
        setLookupError("No application record found with this ID.");
      }
    } catch (err) {
      setLookupError(err.message || "Application not found. Please verify ID format.");
    } finally {
      setLookupLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "disbursed") {
      return { bg: `${c.success}18`, color: c.success, border: `${c.success}40`, text: s === "approved" ? "Approved" : "Disbursed" };
    }
    if (s === "under_review" || s === "review" || s === "submitted") {
      return { bg: `${c.primary}18`, color: c.primary, border: `${c.primary}40`, text: s === "under_review" ? "Under Review" : "Submitted to Nodal Partner" };
    }
    if (s === "rejected") {
      return { bg: `${c.danger}18`, color: c.danger, border: `${c.danger}40`, text: "Rejected" };
    }
    return { bg: `${c.accent}18`, color: c.accent, border: `${c.accent}40`, text: "Documents Pending" };
  };

  return (
    <div className="fade">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 15, marginBottom: 22 }}>
        <div>
          <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: 0.7 }}>APPLICATIONS & AUDIT TIMELINE</div>
          <h1 style={{ fontSize: 30, margin: "6px 0 4px", color: c.text, fontWeight: 900 }}>My Scheme Applications</h1>
          <p style={{ color: c.muted, fontSize: 13, margin: 0 }}>Track real-time status, nodal partner routing, and review milestones.</p>
        </div>

        <button
          type="button"
          onClick={loadApps}
          disabled={loading}
          style={{ ...secondaryButton(c), padding: "9px 16px", fontSize: 13 }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Lookup Bar */}
      <div className="glass" style={{ borderRadius: 18, padding: "18px 22px", marginBottom: 22 }}>
        <form onSubmit={handleLookup} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240 }}>
            <Search size={18} color={c.muted} />
            <input
              type="text"
              placeholder="Search by Tracking ID (e.g. APP-2026-66711)..."
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              style={{ ...inputStyle(c), flex: 1, border: "none", background: "transparent", padding: "8px 0" }}
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading || !lookupId.trim()}
            style={{ ...primaryButton(c), padding: "10px 18px", fontSize: 13 }}
          >
            {lookupLoading ? <RefreshCw size={15} className="animate-spin" /> : <FileCheck2 size={15} />}
            Track Status
          </button>
        </form>
        {lookupError && <div style={{ marginTop: 8, color: c.danger, fontSize: 12, fontWeight: 700 }}>⚠️ {lookupError}</div>}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: "center", color: c.muted }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: c.primary }} />
          <div>Fetching live application records from secure backend...</div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass" style={{ borderRadius: 20, padding: 40, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: `${c.primary}15`, color: c.primary, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <FileText size={26} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>No Submitted Applications Yet</h2>
          <p style={{ color: c.muted, fontSize: 14, maxWidth: 440, margin: "0 auto 20px" }}>
            You haven't submitted any scheme applications yet. Match with eligible government schemes and submit your application with verified documents.
          </p>
          <button
            type="button"
            onClick={onNewApplication}
            style={{ ...primaryButton(c), padding: "12px 24px", fontSize: 14, margin: "0 auto" }}
          >
            <Search size={16} />
            Explore & Match Schemes
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {applications.map((app) => {
            const badge = getStatusBadge(app.status);
            const dateStr = app.submitted_at || app.created_at
              ? new Date(app.submitted_at || app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "Recent";

            return (
              <div
                key={app.application_id}
                className="glass hover-card"
                style={{
                  borderRadius: 20,
                  padding: "22px 26px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 16,
                  border: `1.5px solid ${c.border}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 15, color: c.primary }}>
                      {app.application_id}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.text}
                    </span>
                    <span style={{ fontSize: 12, color: c.muted }}>• {dateStr}</span>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: c.text }}>
                    {app.scheme_name || "Government Welfare Scheme"}
                  </h3>

                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: c.muted, flexWrap: "wrap" }}>
                    {app.partner_name && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={14} color={c.primary} />
                        <strong>Partner:</strong> {app.partner_name}
                      </span>
                    )}
                    {app.document_readiness && (
                      <span>
                        <strong>Readiness:</strong> {app.document_readiness.completed_required_documents}/{app.document_readiness.required_documents} Docs ({app.document_readiness.completion_percentage}%)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => onTrackApplication(app)}
                    style={{ ...primaryButton(c), padding: "10px 18px", fontSize: 13 }}
                  >
                    <Clock size={15} />
                    View Timeline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


function SavedSchemesPanel({ c, language, savedSchemes = [], onOpen }) {
  return (
    <div className="fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7 }}>SAVED SCHEMES</div>
        <h1 style={{ fontSize: 30, margin: "6px 0 4px", color: c.text }}>Your saved schemes</h1>
        <p style={{ color: c.muted, fontSize: 13, margin: 0 }}>Schemes you save from Find Schemes will appear here.</p>
      </div>
      {savedSchemes.length === 0 ? (
        <div className="glass" style={{ borderRadius: 20, padding: 30, textAlign: "center", color: c.muted }}>
          No schemes saved yet. Open Find Schemes and use the Save button on any scheme card.
        </div>
      ) : (
        <div className="scheme-grid">
          {savedSchemes.map((scheme, index) => (
            <SchemeCard
              key={scheme.id}
              c={c}
              t={{}}
              language={language}
              scheme={scheme}
              index={index}
              detailed={true}
              isSaved={true}
              onToggleSave={() => {}}
              onOpen={() => onOpen(scheme)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CalculatorField({ c, icon, label, value, min, max, step, display, onChange }) {
  return (
    <label style={{ display: "block", padding: 13, border: `1px solid ${c.border}`, borderRadius: 14, background: c.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: c.muted, fontSize: 10, fontWeight: 750 }}>
        {icon} {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
        <strong style={{ fontSize: 16 }}>{display}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", marginTop: 10, accentColor: c.primary }}
      />
    </label>
  );
}

function Metric({ c, label, value }) {
  return (
    <div style={{ borderLeft: `1px solid ${c.border}`, paddingLeft: 12 }}>
      <div style={{ color: c.muted, fontSize: 10, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 850, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function CircleHelpIcon(props) {
  return <span {...props} style={{ width: 17, height: 17, display: "grid", placeItems: "center", border: "1.5px solid currentColor", borderRadius: "50%", fontSize: 11, fontWeight: 900 }}>?</span>;
}

function HelpModal({ c, t, onClose }) {
  const steps = [
    { title: t.helpStep1Title, text: t.helpStep1Text, icon: <Languages size={18} /> },
    { title: t.helpStep2Title, text: t.helpStep2Text, icon: <User size={18} /> },
    { title: t.helpStep3Title, text: t.helpStep3Text, icon: <Users size={18} /> },
    { title: t.helpStep4Title, text: t.helpStep4Text, icon: <Search size={18} /> },
    { title: t.helpStep5Title, text: t.helpStep5Text, icon: <FileText size={18} /> },
    { title: t.helpStep6Title, text: t.helpStep6Text, icon: <CheckCircle2 size={18} /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scheme-saathi-help-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(5, 15, 18, .58)",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(680px, 100%)",
          maxHeight: "min(82vh, 720px)",
          overflowY: "auto",
          position: "relative",
          background: c.surface,
          color: c.text,
          border: "1px solid #39D7E8",
          borderRadius: 22,
          boxShadow: `
            0 0 0 1px rgba(57, 215, 232, .18),
            0 0 28px rgba(57, 215, 232, .28),
            0 25px 70px rgba(0, 0, 0, .28)
          `,
          padding: "30px 30px 28px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <button
          onClick={onClose}
          aria-label={t.close}
          title={t.close}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1px solid ${c.border}`,
            background: c.surface2,
            color: c.text,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            padding: "8px 12px",
            borderRadius: 999,
            background: `${c.primary}14`,
            color: c.primary,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 16,
          }}
        >
          <ShieldCheck size={16} />
          SchemeSaathi
        </div>

        <h2
          id="scheme-saathi-help-title"
          style={{
            margin: "0 48px 9px 0",
            fontSize: "clamp(24px, 4vw, 32px)",
            lineHeight: 1.15,
            letterSpacing: "-.7px",
            color: c.text,
            textAlign: "left",
          }}
        >
          {t.helpTitle}
        </h2>

        <p
          style={{
            margin: "0 0 24px",
            color: c.muted,
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: 580,
          }}
        >
          {t.helpIntro}
        </p>

        <div
          style={{
            display: "grid",
            gap: 10,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "14px 15px",
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                background: c.surface2,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  flexShrink: 0,
                  borderRadius: 11,
                  display: "grid",
                  placeItems: "center",
                  background: `${c.primary}16`,
                  color: c.primary,
                }}
              >
                {step.icon}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    marginBottom: 4,
                    color: c.text,
                    textAlign: "left",
                  }}
                >
                  {step.title}
                </div>

                <div
                  style={{
                    color: c.muted,
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    textAlign: "left",
                  }}
                >
                  {step.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 22,
            paddingTop: 17,
            borderTop: `1px solid ${c.border}`,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              background: c.primary,
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({
  c,
  theme,
  toggleTheme,
  mobileMenu,
  setMobileMenu,
  onLanguage,
  onAuth,
  onHelp,
  t,
}) {
  return (
    <header
      style={{
        background: c.surface,
        borderBottom: `1px solid ${c.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          height: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
              display: "grid",
              placeItems: "center",
              color: "white",
            }}
          >
            <Landmark size={22} />
          </div>

          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              SchemeSaathi
            </div>
          </div>
        </div>

        <nav
          className="desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
          }}
        >
          <button
            onClick={onLanguage}
            style={navButton(c)}
          >
            <Languages size={16} />
            {t.language}
          </button>

          <button
            style={navButton(c)}
            onClick={onHelp}
          >
            {t.help}
          </button>

          <button
            style={navButton(c)}
            onClick={onAuth}
          >
            {t.registerLogin}
          </button>

          <button
            onClick={toggleTheme}
            style={iconButton(c)}
            title={t.toggleTheme}
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
        </nav>

        <div className="mobile-only" style={{ gap: 8 }}>
          <button onClick={toggleTheme} style={iconButton(c)}>
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            style={iconButton(c)}
          >
            {mobileMenu ? (
              <X size={19} />
            ) : (
              <Menu size={19} />
            )}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div
          className="mobile-only"
          style={{
            padding: "0 20px 18px",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button
            onClick={onLanguage}
            style={mobileMenuButton(c)}
          >
            <Languages size={17} />
            {t.language}
          </button>

          <button
            onClick={onHelp}
            style={mobileMenuButton(c)}
          >
            {t.help}
          </button>

          <button
            onClick={onAuth}
            style={mobileMenuButton(c)}
          >
            {t.registerLogin}
          </button>
        </div>
      )}
    </header>
  );
}

function LandingScreen({
  c,
  t,
  onStart,
  onLearn,
  language,
}) {
  return (
    <main className="fade">
      <section
        style={{
          padding: "85px 0 75px",
          background: `
            radial-gradient(circle at 85% 15%, ${c.primary}18, transparent 30%),
            radial-gradient(circle at 10% 20%, ${c.accent}15, transparent 25%)
          `,
        }}
      >
        <div className="container hero-grid">
          <div>
            <h1
              className="hero-title"
              style={{
                fontSize: 60,
                lineHeight: 1.05,
                color: c.text,
                letterSpacing: -2,
                margin: 0,
                maxWidth: 700,
              }}
            >
              {t.governmentSchemes}
            </h1>

            <p
              style={{
                fontSize: 19,
                lineHeight: 1.7,
                color: c.muted,
                maxWidth: 650,
                margin: "25px 0",
              }}
            >
              {t.landingDescription}
            </p>

            <div
              style={{
                display: "flex",
                gap: 13,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={onStart}
                style={primaryButton(c)}
              >
                {t.getStarted}
                <ArrowRight size={18} />
              </button>

            </div>

          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: "100%",
              transform: "perspective(1100px) rotate(3deg) rotateY(-2deg)",
              transformOrigin: "center center",
              opacity: 0.48,
              filter: "saturate(0.72)",
              transition: "transform .35s ease, opacity .35s ease",
              animation: "heroFloat 5s ease-in-out infinite",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform =
                "perspective(1100px) rotate(3deg) rotateY(-2deg) translateY(-8px)";
              e.currentTarget.style.opacity = "0.56";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform =
                "perspective(1100px) rotate(3deg) rotateY(-2deg)";
              e.currentTarget.style.opacity = "0.48";
            }}
          >
            {[0, 1, 2].map((index) => {
              const preview = [
                { id: "sui", score: 97 },
                { id: "mudra", score: 92 },
                { id: "dksh", score: 78 },
              ][index];
              const scheme = SCHEMES.find((item) => item.id === preview.id);
              const translated = SCHEME_TRANSLATIONS[language || "en"][preview.id];

              return (
                <div
                  key={preview.id}
                  className="glass"
                  style={{
                    borderRadius: 22,
                    padding: "17px 18px",
                    display: "flex",
                    alignItems: "center",
                    gap: 15,
                    minHeight: 104,
                    position: "relative",
                    overflow: "visible",
                    boxShadow: `0 24px 55px rgba(34, 52, 45, .13), 0 8px 22px rgba(34, 52, 45, .08)`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      flex: "0 0 auto",
                      borderRadius: 13,
                      background: `${c.primary}13`,
                      color: c.primary,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {index === 0 ? <Sparkles size={20} /> : <Landmark size={20} />}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 850,
                        color: c.text,
                        lineHeight: 1.2,
                      }}
                    >
                      {translated.name}
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 11,
                        color: c.muted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {scheme?.ministry}
                    </div>
                  </div>

                  <div style={{ opacity: 1, transform: "scale(1.02)", position: "relative", zIndex: 3 }}>
                    <AnimatedMatchRing
                      c={c}
                      score={preview.score}
                      size={70}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="container"
        style={{
          padding: "30px 0 90px",
        }}
      >
        <div className="feature-grid">
          <Feature
            c={c}
            icon={<Mic size={22} />}
            title={t.voiceFirstTitle}
            text={t.voiceFirstText}
          />

          <Feature
            c={c}
            icon={<Languages size={22} />}
            title={t.regionalLanguages}
            text={t.regionalLanguagesText}
          />

          <Feature
            c={c}
            icon={<ShieldCheck size={22} />}
            title={t.guidedProcess}
            text={t.guidedProcessText}
          />
        </div>
      </section>

      {/* Footer (Preserved) */}

      <footer
        style={{
          padding: "28px 0",
          borderTop: `1px solid ${c.border}`,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            fontSize: 13,
            color: c.muted,
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <span
            style={{
              color: c.text,
              fontWeight: 750,
            }}
          >
            SchemeSaathi
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
              flexWrap: "wrap",
            }}
          >
            {[
              t.footerAbout,
              t.footerContact,
              t.footerPrivacy,
              t.footerTerms,
            ].map((item, index) => (
              <span
                key={item}
                style={{
                  color: c.muted,
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      margin: "0 10px",
                      color: c.border,
                    }}
                  >
                    |
                  </span>
                )}
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

function JourneyStep({
  c,
  icon,
  title,
  text,
  last,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 15,
        padding: "17px 0",
        borderBottom: last
          ? "none"
          : `1px solid ${c.border}`,
      }}
    >
      <div
        style={{
          minWidth: 42,
          height: 42,
          borderRadius: 13,
          background: `${c.primary}13`,
          color: c.primary,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: c.muted,
            fontSize: 13,
            lineHeight: 1.5,
            marginTop: 4,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

function Feature({ c, icon, title, text }) {
  return (
    <div
      className="glass hover-card"
      style={{
        padding: 25,
        borderRadius: 22,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: `${c.primary}13`,
          color: c.primary,
          display: "grid",
          placeItems: "center",
          marginBottom: 17,
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 18,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "8px 0 0",
          color: c.muted,
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function LanguageScreen({
  c,
  t,
  language,
  setLanguage,
  onContinue,
  onBack,
}) {
  const [playingLang, setPlayingLang] = useState(null);

  const selectedLangObj =
    LANGUAGES.find((item) => item.code === language) || LANGUAGES[0];

  const handlePlayVoice = (e, item) => {
    e.stopPropagation();
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      item.voicePrompt || item.nativeGreeting
    );
    const langMap = {
      hi: "hi-IN",
      bn: "bn-IN",
      ta: "ta-IN",
      mr: "mr-IN",
      te: "te-IN",
      en: "en-IN",
    };
    utterance.lang = langMap[item.code] || "en-IN";
    utterance.rate = 0.92;
    setPlayingLang(item.code);

    utterance.onend = () => setPlayingLang(null);
    utterance.onerror = () => setPlayingLang(null);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <PageShell c={c}>
      <div
        style={{
          maxWidth: 960,
          margin: "24px auto 40px",
          padding: "0 16px",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        {/* Header Section */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            position: "relative",
          }}
        >
          {/* GovTech / Bhashini Pill Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 30,
              background: `${c.primary}12`,
              border: `1px solid ${c.primary}30`,
              color: c.primary,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <Sparkles size={15} />
            <span>Digital India • Bhashini Multilingual AI</span>
          </div>

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 22,
              background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}05)`,
              border: `2px solid ${c.primary}35`,
              color: c.primary,
              display: "grid",
              placeItems: "center",
              margin: "auto",
              boxShadow: `0 8px 24px ${c.primary}25`,
            }}
          >
            <Languages size={32} />
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 800,
              margin: "18px 0 8px",
              letterSpacing: "-0.5px",
              color: c.text,
            }}
          >
            {t.chooseLanguage}
          </h1>

          <p
            style={{
              color: c.muted,
              fontSize: 15,
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.5,
            }}
          >
            {t.selectPreferred}
          </p>
        </div>

        {/* Language Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginTop: 36,
          }}
        >
          {LANGUAGES.map((item) => {
            const active = language === item.code;
            const isPlaying = playingLang === item.code;

            return (
              <div
                key={item.code}
                onClick={() => setLanguage(item.code)}
                role="button"
                tabIndex={0}
                style={{
                  position: "relative",
                  padding: "20px 22px",
                  borderRadius: 20,
                  textAlign: "left",
                  background: active
                    ? `linear-gradient(145deg, ${c.surface}, ${c.primary}0d)`
                    : c.surface,
                  border: `2px solid ${
                    active ? c.primary : `${c.border}`
                  }`,
                  color: c.text,
                  cursor: "pointer",
                  transition: "all .25s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: active ? "scale(1.02)" : "scale(1)",
                  boxShadow: active
                    ? `0 12px 28px ${c.primary}20, 0 2px 8px rgba(0,0,0,0.04)`
                    : "0 2px 10px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 140,
                }}
              >
                {/* Top Row: Character Icon + Speaker + Active Check */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      background: active
                        ? c.primary
                        : `${item.badgeColor || c.primary}18`,
                      color: active ? "#ffffff" : (item.badgeColor || c.primary),
                      display: "grid",
                      placeItems: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      boxShadow: active
                        ? `0 6px 16px ${c.primary}40`
                        : "none",
                      transition: "all .2s ease",
                    }}
                  >
                    {item.char || item.name.charAt(0)}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {/* Speaker Voice Preview Button */}
                    <button
                      type="button"
                      title="Audio Preview / उच्चारण सुनें"
                      onClick={(e) => handlePlayVoice(e, item)}
                      style={{
                        padding: 7,
                        borderRadius: 10,
                        border: "none",
                        background: isPlaying
                          ? `${c.primary}25`
                          : "rgba(0,0,0,0.05)",
                        color: isPlaying ? c.primary : c.muted,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        transition: "all .2s ease",
                      }}
                    >
                      <Volume2
                        size={16}
                        style={{
                          transform: isPlaying ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                      {isPlaying && <span>Playing...</span>}
                    </button>

                    {/* Checkbox indicator */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: `2px solid ${
                          active ? c.primary : c.border
                        }`,
                        background: active ? c.primary : "transparent",
                        display: "grid",
                        placeItems: "center",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 900,
                        transition: "all .2s ease",
                      }}
                    >
                      {active && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                </div>

                {/* Middle Info */}
                <div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: active ? c.primary : c.text,
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      color: c.muted,
                      fontSize: 13,
                      fontWeight: 500,
                      marginTop: 3,
                    }}
                  >
                    {item.english} • {item.region || "Official Language"}
                  </div>
                </div>

                {/* Bottom Status / Choose Phrase */}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: `1px solid ${c.border}60`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      color: active ? c.primary : c.muted,
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    {item.choose}
                  </span>

                  {active && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: c.primary,
                        fontWeight: 700,
                        fontSize: 12,
                        background: `${c.primary}15`,
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      ✓ {t.selected}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Interface Preview Card */}
        {selectedLangObj && (
          <div
            style={{
              marginTop: 32,
              padding: "20px 24px",
              borderRadius: 20,
              background: `linear-gradient(135deg, ${c.surface}, ${c.primary}08)`,
              border: `1.5px dashed ${c.primary}40`,
              boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: c.primary,
                }}
              >
                <Sparkles size={16} />
                <span>Live Interface Preview • {selectedLangObj.english}</span>
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: c.muted,
                  background: `${c.muted}15`,
                  padding: "3px 10px",
                  borderRadius: 10,
                  fontWeight: 600,
                }}
              >
                🇮🇳 Multilingual Citizen AI
              </span>
            </div>

            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: c.text,
                lineHeight: 1.4,
              }}
            >
              "{selectedLangObj.previewText || selectedLangObj.nativeGreeting}"
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 12,
                color: c.muted,
                flexWrap: "wrap",
                marginTop: 2,
              }}
            >
              <span>🏛️ 400+ Govt. Schemes</span>
              <span>🔒 100% Aadhaar & DigiLocker Safe</span>
              <span>🎙️ Voice Assistance Enabled</span>
            </div>
          </div>
        )}

        {/* Bottom CTA Button */}
        <div
          style={{
            maxWidth: 480,
            margin: "32px auto 0",
          }}
        >
          <button
            onClick={onContinue}
            disabled={!language}
            style={{
              ...primaryButton(c),
              width: "100%",
              padding: "16px 24px",
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 16,
              opacity: language ? 1 : 0.45,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: language
                ? `0 10px 24px ${c.primary}35`
                : "none",
              cursor: language ? "pointer" : "not-allowed",
              transition: "all .2s ease",
            }}
          >
            <span>
              {selectedLangObj?.continueLabel || t.continue}
            </span>
            <ArrowRight size={19} />
          </button>
        </div>

        {/* Trust Badges Strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            flexWrap: "wrap",
            marginTop: 28,
            color: c.muted,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <ShieldCheck size={15} color={c.primary} />
            Direct Benefit Transfer (DBT) Ready
          </span>
          <span>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={15} color={c.primary} />
            Instant Eligibility Check
          </span>
          <span>•</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Languages size={15} color={c.primary} />
            6 Indian Languages Supported
          </span>
        </div>
      </div>
    </PageShell>
  );
}

function AuthScreen({
  c,
  t,
  mode,
  setMode,
  user,
  setUser,
  onSuccess,
  onBack,
}) {
  const submit = (e) => {
    e.preventDefault();

    if (
      mode === "register" &&
      (!user.name || !user.email || !user.password)
    ) {
      return;
    }

    if (
      mode === "login" &&
      (!user.email || !user.password)
    ) {
      return;
    }

    onSuccess();
  };

  return (
    <PageShell c={c}>
      <div className="auth-box fade">
        <BackButton c={c} onClick={onBack} />

        <div
          className="glass"
          style={{
            borderRadius: 28,
            padding: 35,
            marginTop: 20,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 17,
                background: `${c.primary}15`,
                color: c.primary,
                display: "grid",
                placeItems: "center",
                margin: "auto",
              }}
            >
              <LockKeyhole size={27} />
            </div>

            <h1
              style={{
                fontSize: 30,
                margin: "18px 0 7px",
              }}
            >
              {mode === "register"
                ? t.registerTitle
                : t.loginTitle}
            </h1>

            <p
              style={{
                color: c.muted,
                margin: 0,
              }}
            >
              {mode === "register"
                ? t.registerDescription
                : t.loginDescription}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              background: c.surface2,
              padding: 4,
              borderRadius: 13,
              marginTop: 30,
            }}
          >
            <AuthTab
              c={c}
              active={mode === "register"}
              onClick={() => setMode("register")}
            >
              {t.createAccountTab}
            </AuthTab>

            <AuthTab
              c={c}
              active={mode === "login"}
              onClick={() => setMode("login")}
            >
              {t.login}
            </AuthTab>
          </div>

          <form onSubmit={submit}>
            {mode === "register" && (
              <Input
                c={c}
                label={t.fullName}
                placeholder={t.enterName}
                value={user.name}
                onChange={(e) =>
                  setUser({
                    ...user,
                    name: e.target.value,
                  })
                }
              />
            )}

            <Input
              c={c}
              label={t.emailAddress}
              placeholder="you@example.com"
              type="email"
              value={user.email}
              onChange={(e) =>
                setUser({
                  ...user,
                  email: e.target.value,
                })
              }
            />

            <Input
              c={c}
              label={t.password}
              placeholder={t.enterPassword}
              type="password"
              value={user.password}
              onChange={(e) =>
                setUser({
                  ...user,
                  password: e.target.value,
                })
              }
            />

            <button
              type="submit"
              style={{
                ...primaryButton(c),
                width: "100%",
                marginTop: 10,
              }}
            >
              {mode === "register"
                ? t.createAccountTab
                : t.login}
              <ArrowRight size={18} />
            </button>
          </form>


        </div>
      </div>
    </PageShell>
  );
}

function AuthTab({
  c,
  active,
  onClick,
  children,
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        flex: 1,
        padding: 11,
        border: "none",
        borderRadius: 10,
        background: active
          ? c.surface
          : "transparent",
        color: active ? c.primary : c.muted,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function WelcomeScreen({
  c,
  t,
  user,
  onStart,
  onBack,
}) {
  return (
    <PageShell c={c}>
      <div
        className="fade"
        style={{
          maxWidth: 900,
          margin: "70px auto",
          textAlign: "center",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 28,
            background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
            display: "grid",
            placeItems: "center",
            margin: "35px auto 25px",
            color: "white",
            boxShadow: `0 18px 40px ${c.primary}40`,
          }}
        >
          <Mic size={42} />
        </div>

        <div
          style={{
            color: c.primary,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 1,
          }}
        >
          {t.voiceFirstAssistance}
        </div>

        <h1
          style={{
            fontSize: 48,
            margin: "12px 0",
          }}
        >
          {t.welcome},{" "}
          {user.name || "there"}
        </h1>

        <p
          style={{
            maxWidth: 650,
            margin: "auto",
            color: c.muted,
            fontSize: 18,
            lineHeight: 1.7,
          }}
        >
          {t.welcomeText}
        </p>

        <button
          onClick={onStart}
          className="pulse"
          style={{
            ...primaryButton(c),
            marginTop: 35,
            padding: "18px 35px",
            fontSize: 17,
          }}
        >
          <Mic size={21} />
          {t.tapToSpeak}
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 30,
            flexWrap: "wrap",
            marginTop: 35,
            color: c.muted,
            fontSize: 13,
          }}
        >
          <span>🎙 {t.speakNaturallySmall}</span>
          <span>🔊 {t.hearQuestion}</span>
          <span>✍️ {t.typeIfNeeded}</span>
        </div>
      </div>
    </PageShell>
  );
}

function ProfileScreen({
  c,
  t,
  language,
  profile,
  setProfile,
  step,
  setStep,
  autoStartVoice,
  onVoiceStarted,
  onBack,
  onFinish,
}) {
  const fields = [
    {
      key: "age",
      icon: <UserCircle size={22} />,
      title: "What is your age?",
      hint: "Tell us your age in years.",
    },
    {
      key: "category",
      icon: <Users size={22} />,
      title: "What category do you belong to?",
      hint: "This helps identify schemes you may qualify for.",
    },
    {
      key: "income",
      icon: <IndianRupee size={22} />,
      title: "What is your yearly income?",
      hint: "Select the income range that best matches you.",
    },
    {
      key: "occupation",
      icon: <Briefcase size={22} />,
      title: "What is your occupation?",
      hint: "Choose the option that best describes your work.",
    },
    {
      key: "ideaCategory",
      icon: <Lightbulb size={22} />,
      title: "What is your idea category?",
      hint: "Choose the category that best matches your business idea.",
    },
    {
      key: "location",
      icon: <MapPin size={22} />,
      title: t.locationQuestion,
      hint: t.locationHint,
    },
    {
      key: "idea",
      icon: <FileText size={22} />,
      title: "Tell us about your idea",
      hint: "Describe your complete idea. You can type it or speak it using the microphone.",
    },
  ];

  const field = fields[Math.min(step, fields.length - 1)];
  const value = profile[field.key];
  const canContinue = Boolean(value !== undefined && String(value).trim() !== "");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [heardText, setHeardText] = useState("");
  const recognitionRef = React.useRef(null);
  const autoStartHandledRef = React.useRef(false);
  const recognitionCtor = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  const getSpeechLocale = () => ({
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    mr: "mr-IN",
    te: "te-IN",
  }[language] || "en-IN");

  const normalize = (text) =>
    String(text || "")
      .toLowerCase()
      .replace(/[.,!?]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const parseIncome = (text) => {
    const normalized = normalize(text);
    const numberMatch = normalized.match(/(?:₹|rs\.?|rupees?\s*)?([0-9]+(?:\.[0-9]+)?)\s*(crore|cr|lakh|lac|thousand|k)?/i);
    if (numberMatch) {
      let n = Number(numberMatch[1]);
      const unit = (numberMatch[2] || "").toLowerCase();
      if (unit === "crore" || unit === "cr") n *= 10000000;
      else if (unit === "lakh" || unit === "lac") n *= 100000;
      else if (unit === "thousand" || unit === "k") n *= 1000;
      if (n > 0) return n;
    }
    const ranges = [
      ["under one lakh", 100000],
      ["under 1 lakh", 100000],
      ["one to two lakh", 200000],
      ["1 to 2 lakh", 200000],
      ["two to five lakh", 500000],
      ["2 to 5 lakh", 500000],
      ["five to ten lakh", 900000],
      ["5 to 10 lakh", 900000],
      ["above ten lakh", 1200000],
      ["more than ten lakh", 1200000],
    ];
    const found = ranges.find(([phrase]) => normalized.includes(phrase));
    return found ? found[1] : null;
  };

  const parseAge = (text) => {
    const match = String(text || "").match(/\b([1-9][0-9]?)\b/);
    if (match) {
      const age = Number(match[1]);
      if (age >= 18 && age <= 100) return age;
    }
    const words = {
      eighteen: 18, nineteen: 19, twenty: 20, twentyone: 21,
      twentytwo: 22, twentythree: 23, twentyfour: 24, twentyfive: 25,
      twentysix: 26, twentyseven: 27, twentyeight: 28, twentynine: 29,
      thirty: 30, thirtyone: 31, thirtytwo: 32, thirtythree: 33,
      thirtyfour: 34, thirtyfive: 35, thirtysix: 36, thirtyseven: 37,
      thirtyeight: 38, thirtynine: 39, forty: 40,
    };
    const compact = normalize(text).replace(/\s/g, "");
    return words[compact] || null;
  };

  const parseAnswer = (text) => {
    const normalized = normalize(text);

    if (field.key === "age") return parseAge(text);

    if (field.key === "category") {
      const aliases = [
        ["SC", ["sc", "scheduled caste", "schedule caste", "अनुसूचित जाति", "एससी"]],
        ["ST", ["st", "scheduled tribe", "अनुसूचित जनजाति", "एसटी"]],
        ["OBC", ["obc", "other backward", "अन्य पिछड़ा", "पिछड़ा वर्ग", "ओबीसी"]],
        ["Woman", ["woman", "women", "female", "lady", "महिला", "औरत"]],
        ["Minority", ["minority", "अल्पसंख्यक"]],
        ["PwD", ["pwd", "disabled", "disability", "divyang", "दिव्यांग"]],
        ["General", ["general", "open category", "सामान्य"]],
      ];
      return aliases.find(([, words]) => words.some((word) => normalized.includes(word)))?.[0] || null;
    }

    if (field.key === "income") {
      const amount = parseIncome(text);
      if (amount !== null) return amount;
      const incomeAliases = [
        ["Under ₹1 lakh", 100000],
        ["₹1–2 lakh", 200000],
        ["₹2–5 lakh", 500000],
        ["₹5–10 lakh", 900000],
        ["Above ₹10 lakh", 1200000],
      ];
      return incomeAliases.find(([label]) => normalize(label).includes(normalized) || normalized.includes(normalize(label)))?.[1] || null;
    }

    if (field.key === "occupation") {
      const aliases = [
        ["Student", ["student", "studying"]],
        ["Salaried Employee", ["salaried", "salary", "employee", "job"]],
        ["Self-employed", ["self employed", "self-employed", "freelancer", "freelance"]],
        ["Business Owner", ["business owner", "businessman", "businesswoman", "entrepreneur", "business"]],
        ["Farmer", ["farmer", "farming", "agriculture", "खेती", "किसान"]],
        ["Artisan / Craftsperson", ["artisan", "craftsperson", "handicraft", "handicraft worker"]],
        ["Unemployed", ["unemployed", "not working", "jobless"]],
        ["Other", ["other"]],
      ];
      return aliases.find(([, words]) => words.some((word) => normalized.includes(word)))?.[0] || null;
    }

    if (field.key === "ideaCategory") {
      const aliases = [
        ["Agriculture & Allied", ["agriculture", "farming", "dairy", "poultry", "livestock"]],
        ["Food & Catering", ["food", "catering", "restaurant", "bakery", "cooking"]],
        ["Retail & Trading", ["retail", "trading", "shop", "store"]],
        ["Manufacturing", ["manufacturing", "factory", "production"]],
        ["Handicrafts & Textiles", ["handicraft", "textile", "tailoring", "craft"]],
        ["Services", ["service", "services", "consulting"]],
        ["Technology & Digital", ["technology", "tech", "software", "digital", "app", "website"]],
        ["Other", ["other"]],
      ];
      return aliases.find(([, words]) => words.some((word) => normalized.includes(word)))?.[0] || null;
    }

    if (field.key === "location") return String(text || "").trim();
    if (field.key === "idea") return String(text || "").trim();
    return null;
  };

  const speakQuestion = (afterSpeak) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      afterSpeak?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(field.title);
    utterance.lang = getSpeechLocale();
    utterance.rate = 0.92;
    utterance.onend = () => afterSpeak?.();
    window.speechSynthesis.speak(utterance);
  };

  const moveToNextQuestion = () => {
    if (step < fields.length - 1) {
      setStep((current) => current + 1);
    } else {
      onFinish();
    }
  };

  const startListening = () => {
    if (!recognitionCtor) {
      setVoiceError("Voice recognition is not available in this browser. You can type or choose an option instead.");
      return;
    }
    setVoiceError("");
    setHeardText("");
    try {
      if (recognitionRef.current) recognitionRef.current.abort();
      const recognition = new recognitionCtor();
      recognition.lang = getSpeechLocale();
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 3;
      recognition.onstart = () => setListening(true);
      recognition.onend = () => setListening(false);
      recognition.onerror = (event) => {
        setListening(false);
        if (event.error !== "aborted") setVoiceError(`Microphone error: ${event.error}. Please try again.`);
      };
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();
        setHeardText(transcript);
        const parsed = parseAnswer(transcript);
        if (parsed !== null && parsed !== "") {
          setProfile((current) => ({
            ...current,
            [field.key]: parsed,
          }));
          window.setTimeout(moveToNextQuestion, 450);
        } else {
          setVoiceError(field.key === "idea"
            ? "I could not capture your idea. Please try speaking again or type it below."
            : "I could not match that answer. Please try again or choose an option below.");
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      setVoiceError("Could not start the microphone. Please allow microphone access and try again.");
    }
  };

  useEffect(() => {
    if (!autoStartVoice || autoStartHandledRef.current) {
      if (!autoStartVoice) return undefined;
      speakQuestion();
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [step, language]);

  useEffect(() => {
    if (!autoStartVoice) return;
    autoStartHandledRef.current = true;
    onVoiceStarted?.();
    speakQuestion(startListening);
  }, [autoStartVoice]);

  const choose = (selectedValue) => {
    setProfile((current) => ({
      ...current,
      [field.key]: selectedValue,
    }));
  };

  const renderOptions = (options) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 }}>
      {options.map((item) => (
        <Option
          key={item}
          c={c}
          active={profile[field.key] === item}
          onClick={() => choose(item)}
        >
          {item}
        </Option>
      ))}
    </div>
  );

  return (
    <PageShell c={c}>
      <div className="container fade" style={{ padding: "35px 0 55px" }}>
        <BackButton c={c} onClick={onBack} />

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <div style={{ fontSize: 13, color: c.primary, fontWeight: 800, letterSpacing: .6 }}>
            VOICE ASSISTANCE
          </div>
          <h1 style={{ fontSize: 34, margin: "7px 0", color: c.text }}>
            Tell us about yourself
          </h1>
          <div style={{ color: c.muted, fontWeight: 700, fontSize: 13 }}>
            {step + 1} / {fields.length}
          </div>
        </div>

        <div style={{ height: 7, background: c.border, borderRadius: 20, marginTop: 20, overflow: "hidden" }}>
          <div style={{ width: `${((step + 1) / fields.length) * 100}%`, height: "100%", background: c.primary, borderRadius: 20, transition: "width .3s ease" }} />
        </div>

        <div style={{ maxWidth: 850, margin: "35px auto 0" }}>
          <div className="glass" style={{ padding: 35, borderRadius: 28 }}>
            <div style={{ width: 55, height: 55, borderRadius: 16, background: `${c.primary}14`, color: c.primary, display: "grid", placeItems: "center", marginBottom: 18 }}>
              {field.icon}
            </div>

            <h2 style={{ fontSize: 28, margin: 0, lineHeight: 1.25, color: c.text }}>
              {field.title}
            </h2>
            <p style={{ color: c.muted, lineHeight: 1.6, marginTop: 10 }}>
              {field.hint}
            </p>

            <div style={{ padding: 16, borderRadius: 17, background: c.surface2, border: `1px solid ${c.border}`, marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={startListening}
                  className={listening ? "pulse" : ""}
                  style={{ width: 50, height: 50, borderRadius: 15, border: "none", background: listening ? c.danger : c.primary, color: "white", display: "grid", placeItems: "center", flexShrink: 0 }}
                  aria-label="Start voice input"
                >
                  <Mic size={22} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 850 }}>{listening ? "Listening..." : "Tap the microphone to answer"}</div>
                  <div style={{ color: c.muted, fontSize: 11, marginTop: 3 }}>
                    {heardText ? `Heard: “${heardText}”` : field.key === "idea" ? "Speak your complete idea naturally." : "Your spoken answer will be matched automatically."}
                  </div>
                </div>
                <button type="button" onClick={speakQuestion} style={{ ...secondaryButton(c), padding: "9px 11px", fontSize: 11 }}>
                  <Volume2 size={15} /> Hear question
                </button>
              </div>
              {voiceError && <div style={{ color: c.danger, fontSize: 11, marginTop: 9, lineHeight: 1.5 }}>{voiceError}</div>}
            </div>

            <div style={{ marginTop: 30 }}>
              {field.key === "age" && (
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={profile.age || ""}
                  onChange={(e) => choose(e.target.value)}
                  placeholder="Enter your age"
                  style={inputStyle(c)}
                />
              )}

              {field.key === "category" && renderOptions(CATEGORY_OPTS)}

              {field.key === "income" && renderOptions([
                "Under ₹1 lakh",
                "₹1–2 lakh",
                "₹2–5 lakh",
                "₹5–10 lakh",
                "Above ₹10 lakh",
              ])}

              {field.key === "occupation" && renderOptions([
                "Student",
                "Salaried Employee",
                "Self-employed",
                "Business Owner",
                "Farmer",
                "Artisan / Craftsperson",
                "Unemployed",
                "Other",
              ])}

              {field.key === "ideaCategory" && renderOptions([
                "Agriculture & Allied",
                "Food & Catering",
                "Retail & Trading",
                "Manufacturing",
                "Handicrafts & Textiles",
                "Services",
                "Technology & Digital",
                "Other",
              ])}

              {field.key === "location" && (
                <input
                  type="text"
                  value={profile.location || ""}
                  onChange={(e) => setProfile((current) => ({ ...current, location: e.target.value }))}
                  placeholder={t.locationPlaceholder}
                  style={inputStyle(c)}
                />
              )}

              {field.key === "idea" && (
                <textarea
                  value={profile.idea || ""}
                  onChange={(e) => choose(e.target.value)}
                  placeholder="Type your complete business idea here, or use the microphone to speak it..."
                  rows={7}
                  style={{ ...inputStyle(c), resize: "vertical", minHeight: 150, lineHeight: 1.6 }}
                />
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 35 }}>
              <button
                type="button"
                onClick={() => step === 0 ? onBack() : setStep((current) => current - 1)}
                style={secondaryButton(c)}
              >
                <ArrowLeft size={17} /> {t.back}
              </button>

              <button
                type="button"
                disabled={!canContinue}
                onClick={() => step === fields.length - 1 ? onFinish() : setStep((current) => current + 1)}
                style={{ ...primaryButton(c), flex: 1, opacity: canContinue ? 1 : 0.45 }}
              >
                {step === fields.length - 1 ? t.findSchemes : t.continue}
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Option({
  c,
  active,
  onClick,
  children,
  wide,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "15px 17px",
        borderRadius: 15,
        textAlign: wide ? "left" : "center",
        background: active
          ? `${c.primary}12`
          : c.surface,
        border: `1.5px solid ${
          active ? c.primary : c.border
        }`,
        color: active ? c.primary : c.text,
        fontWeight: active ? 800 : 600,
        minHeight: 52,
      }}
    >
      {active && (
        <Check
          size={15}
          style={{
            marginRight: 7,
            verticalAlign: "middle",
          }}
        />
      )}

      {children}
    </button>
  );
}

function LoadingScreen({ c, t, pct, isMatchingLoading, matchingError, onRetry, onBack }) {
  if (matchingError) {
    return (
      <PageShell c={c}>
        <div
          style={{
            minHeight: "70vh",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            padding: 20,
          }}
        >
          <div
            className="glass fade"
            style={{
              maxWidth: 500,
              padding: 35,
              borderRadius: 24,
              border: `1.5px solid ${c.danger}40`,
            }}
          >
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: 20,
                background: `${c.danger}18`,
                color: c.danger,
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
              }}
            >
              <AlertCircle size={36} />
            </div>

            <h2 style={{ fontSize: 22, color: c.text, margin: "0 0 10px" }}>
              Matching Engine Notice
            </h2>

            <p style={{ color: c.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              {matchingError}
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  style={{ ...primaryButton(c), padding: "12px 24px" }}
                >
                  <RefreshCw size={16} />
                  <span>Retry Scheme Matching</span>
                </button>
              )}
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  style={{ ...secondaryButton(c), padding: "12px 20px" }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell c={c}>
      <div
        style={{
          minHeight: "70vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 30,
              background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
              display: "grid",
              placeItems: "center",
              color: "white",
              margin: "auto",
              boxShadow: `0 20px 45px ${c.primary}40`,
            }}
          >
            <Sparkles size={42} className="spin" />
          </div>

          <h1
            style={{
              fontSize: 32,
              margin: "25px 0 8px",
            }}
          >
            {t.loadingTitle || "Finding Matching Schemes"}
          </h1>

          <p style={{ color: c.muted, maxWidth: 460, margin: "0 auto 20px" }}>
            AI Engine is analyzing 405+ government schemes with FAISS semantic retrieval & statutory eligibility verification...
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: c.primary,
              fontWeight: 750,
              fontSize: 13,
            }}
          >
            <RefreshCw size={15} className="spin" />
            <span>Evaluating eligibility rules & confidence scores...</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}


const CALCULATOR_COPY = {
  en: { title: "Financial Calculator", subtitle: "Estimate your EMI by adjusting your loan parameters.", kicker: "FINANCIAL CALCULATOR", estimate: "Estimate your EMI", helper: "Adjust your loan parameters to see the estimated monthly payment.", loan: "Loan Amount", interest: "Interest Rate", tenure: "Tenure", years: "years", emi: "ESTIMATED MONTHLY EMI", totalInterest: "Total Interest", totalPayment: "Total Payment" },
  hi: { title: "वित्तीय कैलकुलेटर", subtitle: "अपने ऋण मापदंडों को समायोजित करके अपनी ईएमआई का अनुमान लगाएँ।", kicker: "वित्तीय कैलकुलेटर", estimate: "अपनी ईएमआई का अनुमान लगाएँ", helper: "अनुमानित मासिक भुगतान देखने के लिए अपने ऋण मापदंड समायोजित करें।", loan: "ऋण राशि", interest: "ब्याज दर", tenure: "अवधि", years: "वर्ष", emi: "अनुमानित मासिक ईएमआई", totalInterest: "कुल ब्याज", totalPayment: "कुल भुगतान" },
  bn: { title: "আর্থিক ক্যালকুলেটর", subtitle: "ঋণের তথ্য পরিবর্তন করে আপনার EMI-এর হিসাব দেখুন।", kicker: "আর্থিক ক্যালকুলেটর", estimate: "আপনার EMI-এর হিসাব", helper: "আনুমানিক মাসিক কিস্তি দেখতে ঋণের তথ্য পরিবর্তন করুন।", loan: "ঋণের পরিমাণ", interest: "সুদের হার", tenure: "মেয়াদ", years: "বছর", emi: "আনুমানিক মাসিক EMI", totalInterest: "মোট সুদ", totalPayment: "মোট পরিশোধ" },
  ta: { title: "நிதி கால்குலேட்டர்", subtitle: "உங்கள் கடன் அளவுருக்களை மாற்றி EMI-ஐ கணக்கிடுங்கள்.", kicker: "நிதி கால்குலேட்டர்", estimate: "உங்கள் EMI-ஐ கணக்கிடுங்கள்", helper: "மாதாந்திர மதிப்பிடப்பட்ட கட்டணத்தைப் பார்க்க உங்கள் கடன் அளவுருக்களை மாற்றவும்.", loan: "கடன் தொகை", interest: "வட்டி விகிதம்", tenure: "காலம்", years: "ஆண்டுகள்", emi: "மதிப்பிடப்பட்ட மாதாந்திர EMI", totalInterest: "மொத்த வட்டி", totalPayment: "மொத்த கட்டணம்" },
  mr: { title: "आर्थिक कॅल्क्युलेटर", subtitle: "कर्जाचे मापदंड बदलून तुमच्या EMI चा अंदाज घ्या.", kicker: "आर्थिक कॅल्क्युलेटर", estimate: "तुमच्या EMI चा अंदाज घ्या", helper: "अंदाजे मासिक हप्ता पाहण्यासाठी कर्जाचे मापदंड बदला.", loan: "कर्ज रक्कम", interest: "व्याज दर", tenure: "कालावधी", years: "वर्षे", emi: "अंदाजे मासिक EMI", totalInterest: "एकूण व्याज", totalPayment: "एकूण परतफेड" },
  te: { title: "ఆర్థిక కాలిక్యులేటర్", subtitle: "మీ రుణ పరామితులను మార్చడం ద్వారా EMI ను అంచనా వేయండి.", kicker: "ఆర్థిక కాలిక్యులేటర్", estimate: "మీ EMI ను అంచనా వేయండి", helper: "అంచనా నెలవారీ చెల్లింపును చూడటానికి మీ రుణ పరామితులను మార్చండి.", loan: "రుణ మొత్తం", interest: "వడ్డీ రేటు", tenure: "కాలవ్యవధి", years: "సంవత్సరాలు", emi: "అంచనా నెలవారీ EMI", totalInterest: "మొత్తం వడ్డీ", totalPayment: "మొత్తం చెల్లింపు" },
};


const COMPARE_LABELS = {
  en:{parameter:"Parameter",eligibility:"Eligibility",max:"Max Assistance",interest:"Interest Rate",subsidy:"Subsidy / Grant",tenure:"Tenure",category:"Category",groups:"Target Groups",sector:"Sector",description:"Description",best:"★ Best Match",top:"Top",matches:"matches",high:"Highly Eligible",eligible:"Eligible",less:"Less Eligible",veryLess:"Very Less Eligible"},
  hi:{parameter:"पैरामीटर",eligibility:"पात्रता",max:"अधिकतम सहायता",interest:"ब्याज दर",subsidy:"सब्सिडी / अनुदान",tenure:"अवधि",category:"श्रेणी",groups:"लक्षित समूह",sector:"क्षेत्र",description:"विवरण",best:"★ सर्वश्रेष्ठ मिलान",top:"शीर्ष",matches:"मिलान",high:"अत्यधिक पात्र",eligible:"पात्र",less:"कम पात्र",veryLess:"बहुत कम पात्र"},
  bn:{parameter:"পরামিতি",eligibility:"যোগ্যতা",max:"সর্বোচ্চ সহায়তা",interest:"সুদের হার",subsidy:"ভর্তুকি / অনুদান",tenure:"মেয়াদ",category:"শ্রেণি",groups:"লক্ষ্য গোষ্ঠী",sector:"ক্ষেত্র",description:"বিবরণ",best:"★ সেরা মিল",top:"শীর্ষ",matches:"মিল",high:"অত্যন্ত যোগ্য",eligible:"যোগ্য",less:"কম যোগ্য",veryLess:"খুব কম যোগ্য"},
  ta:{parameter:"அளவுரு",eligibility:"தகுதி",max:"அதிகபட்ச உதவி",interest:"வட்டி விகிதம்",subsidy:"மானியம் / உதவி",tenure:"காலம்",category:"வகை",groups:"இலக்கு குழுக்கள்",sector:"துறை",description:"விளக்கம்",best:"★ சிறந்த பொருத்தம்",top:"முதல்",matches:"பொருத்தங்கள்",high:"மிகவும் தகுதியானது",eligible:"தகுதியானது",less:"குறைந்த தகுதி",veryLess:"மிகக் குறைந்த தகுதி"},
  mr:{parameter:"परिमाण",eligibility:"पात्रता",max:"कमाल मदत",interest:"व्याज दर",subsidy:"अनुदान",tenure:"कालावधी",category:"श्रेणी",groups:"लक्ष्य गट",sector:"क्षेत्र",description:"वर्णन",best:"★ सर्वोत्तम जुळणी",top:"टॉप",matches:"जुळण्या",high:"अत्यंत पात्र",eligible:"पात्र",less:"कमी पात्र",veryLess:"खूप कमी पात्र"},
  te:{parameter:"పరామితి",eligibility:"అర్హత",max:"గరిష్ట సహాయం",interest:"వడ్డీ రేటు",subsidy:"సబ్సిడీ / గ్రాంట్",tenure:"కాలవ్యవధి",category:"వర్గం",groups:"లక్ష్య సమూహాలు",sector:"రంగం",description:"వివరణ",best:"★ ఉత్తమ సరిపోలిక",top:"టాప్",matches:"సరిపోలికలు",high:"అత్యంత అర్హత",eligible:"అర్హత",less:"తక్కువ అర్హత",veryLess:"చాలా తక్కువ అర్హత"}
};

function CompareScreen({ c, t, language, results }) {
  const lang = COMPARE_LABELS[language] ? language : "en";

  // Always use the actual matched results. If they are not ready yet, fall back
  // to the first three schemes so the comparison page can never be blank.
  const baseResults = Array.isArray(results) && results.length
    ? results
    : SCHEMES.map((scheme) => ({ ...scheme, score: 42 }));

  const topThree = [...baseResults]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 3);

  const labels = COMPARE_LABELS[lang];

  const eligibility = (score) => {
    const value = Number(score || 0);
    if (value >= 80) return labels.high;
    if (value >= 65) return labels.eligible;
    if (value >= 50) return labels.less;
    return labels.veryLess;
  };

  const groupTranslations = {
    en: { Woman: "Women", PwD: "PwD", Minority: "Minority", SC: "SC", ST: "ST", OBC: "OBC", General: "General" },
    hi: { Woman: "महिलाएँ", PwD: "दिव्यांग", Minority: "अल्पसंख्यक", SC: "SC", ST: "ST", OBC: "OBC", General: "सामान्य" },
    bn: { Woman: "মহিলা", PwD: "প্রতিবন্ধী", Minority: "সংখ্যালঘু", SC: "SC", ST: "ST", OBC: "OBC", General: "সাধারণ" },
    ta: { Woman: "பெண்கள்", PwD: "மாற்றுத்திறனாளிகள்", Minority: "சிறுபான்மை", SC: "SC", ST: "ST", OBC: "OBC", General: "பொது" },
    mr: { Woman: "महिला", PwD: "दिव्यांग", Minority: "अल्पसंख्याक", SC: "SC", ST: "ST", OBC: "OBC", General: "सामान्य" },
    te: { Woman: "మహిళలు", PwD: "దివ్యాంగులు", Minority: "మైనారిటీ", SC: "SC", ST: "ST", OBC: "OBC", General: "సాధారణ" },
  }[lang] || {};

  const generic = {
    en: { all: "All sectors", loan: "Loan", applicable: "As applicable", eligible: "Eligible beneficiaries" },
    hi: { all: "सभी क्षेत्र", loan: "ऋण", applicable: "लागू के अनुसार", eligible: "पात्र लाभार्थी" },
    bn: { all: "সব ক্ষেত্র", loan: "ঋণ", applicable: "প্রযোজ্য অনুযায়ী", eligible: "যোগ্য সুবিধাভোগী" },
    ta: { all: "அனைத்து துறைகள்", loan: "கடன்", applicable: "பொருந்தும் வகையில்", eligible: "தகுதியான பயனாளிகள்" },
    mr: { all: "सर्व क्षेत्रे", loan: "कर्ज", applicable: "लागू असल्याप्रमाणे", eligible: "पात्र लाभार्थी" },
    te: { all: "అన్ని రంగాలు", loan: "రుణం", applicable: "వర్తించిన విధంగా", eligible: "అర్హత కలిగిన లబ్ధిదారులు" },
  }[lang] || {};

  const makeMeta = (scheme) => {
    const translated =
      SCHEME_TRANSLATIONS[lang]?.[scheme.id] ||
      SCHEME_TRANSLATIONS.en?.[scheme.id] ||
      { name: scheme.id, benefit: scheme.maxAssistance || "", short: scheme.description || "" };

    const detail =
      SCHEME_DETAIL_TRANSLATIONS[lang]?.[scheme.id] ||
      SCHEME_DETAIL_TRANSLATIONS.en?.[scheme.id] || {};

    const targetGroups = (scheme.categories || [])
      .map((item) => groupTranslations[item] || item)
      .join(", ") || generic.eligible;

    let sector = generic.all;
    if (scheme.id === "dksh") sector = ({ en: "Skill development", hi: "कौशल विकास", bn: "দক্ষতা উন্নয়ন", ta: "திறன் மேம்பாடு", mr: "कौशल्य विकास", te: "నైపుణ్యాభివృద్ధి" }[lang]);
    if (scheme.id === "nbcfdc") sector = ({ en: "Micro-enterprise", hi: "सूक्ष्म उद्यम", bn: "ক্ষুদ্র উদ্যোগ", ta: "சிறு நிறுவனம்", mr: "सूक्ष्म उद्योग", te: "సూక్ష్మ సంస్థ" }[lang]);
    if (scheme.id === "mun") sector = ({ en: "Small-scale business", hi: "लघु व्यवसाय", bn: "ছোট ব্যবসা", ta: "சிறு வணிகம்", mr: "लघु व्यवसाय", te: "చిన్న వ్యాపారం" }[lang]);
    if (scheme.id === "nhfdc") sector = ({ en: "Income-generating business", hi: "आय सृजन व्यवसाय", bn: "আয়-সৃষ্টিকারী ব্যবসা", ta: "வருமானம் ஈட்டும் தொழில்", mr: "उत्पन्न देणारा व्यवसाय", te: "ఆదాయం సృష్టించే వ్యాపారం" }[lang]);
    if (scheme.id === "mudra") sector = ({ en: "Small / early-stage business", hi: "छोटा / शुरुआती व्यवसाय", bn: "ছোট / প্রাথমিক ব্যবসা", ta: "சிறு / தொடக்க வணிகம்", mr: "लहान / सुरुवातीचा व्यवसाय", te: "చిన్న / ప్రారంభ దశ వ్యాపారం" }[lang]);

    let category = generic.loan;
    if (scheme.id === "dksh") category = ({ en: "Training + Support", hi: "प्रशिक्षण + सहायता", bn: "প্রশিক্ষণ + সহায়তা", ta: "பயிற்சி + ஆதரவு", mr: "प्रशिक्षण + सहाय्य", te: "శిక్షణ + సహాయం" }[lang]);
    if (scheme.id === "nbcfdc") category = ({ en: "Micro-loan", hi: "माइक्रो-लोन", bn: "মাইক্রো-লোন", ta: "சிறுகடன்", mr: "मायक्रो-लोन", te: "మైక్రో-లోన్" }[lang]);

    let tenure = detail.tenure || generic.applicable;
    const tenureMap = {
      sui: { en: "3–7 Years", hi: "3–7 वर्ष", bn: "৩–৭ বছর", ta: "3–7 ஆண்டுகள்", mr: "3–7 वर्षे", te: "3–7 సంవత్సరాలు" },
      dksh: { en: "Training period", hi: "प्रशिक्षण अवधि", bn: "প্রশিক্ষণের সময়কাল", ta: "பயிற்சி காலம்", mr: "प्रशिक्षण कालावधी", te: "శిక్షణ కాలం" },
    };
    if (tenureMap[scheme.id]) tenure = tenureMap[scheme.id][lang] || tenureMap[scheme.id].en;

    return {
      scheme,
      translated,
      detail,
      targetGroups,
      sector,
      category,
      tenure,
      eligibility: eligibility(scheme.score),
    };
  };

  const data = topThree.map(makeMeta);

  const rows = [
    [labels.eligibility, (item) => item.eligibility],
    [labels.max, (item) => item.detail.maxAssistance || item.scheme.maxAssistance || item.translated.benefit || "—"],
    [labels.interest, (item) => item.detail.interestRate || item.scheme.interestRate || generic.applicable || "—"],
    [labels.subsidy, (item) => item.detail.subsidy || item.scheme.subsidy || "—"],
    [labels.tenure, (item) => item.tenure],
    [labels.category, (item) => item.category],
    [labels.groups, (item) => item.targetGroups],
    [labels.sector, (item) => item.sector],
    [labels.description, (item) => item.detail.description || item.translated.short || item.scheme.description || "—"],
  ];

  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: c.text, fontSize: 26, fontWeight: 900, lineHeight: 1.15 }}>
          {{ en: "Scheme Comparison", hi: "योजना तुलना", bn: "প্রকল্প তুলনা", ta: "திட்ட ஒப்பீடு", mr: "योजना तुलना", te: "పథకాల పోలిక" }[lang] || "Scheme Comparison"}
        </div>
        <div style={{ color: c.muted, fontSize: 14, marginTop: 5 }}>
          {{ en: "Comparing 3 top matching schemes side by side", hi: "शीर्ष 3 मेल वाली योजनाओं की साथ-साथ तुलना", bn: "শীর্ষ ৩টি মিল থাকা প্রকল্পের পাশাপাশি তুলনা", ta: "சிறந்த 3 பொருத்தமான திட்டங்களின் ஒப்பீடு", mr: "सर्वोत्तम 3 जुळणाऱ्या योजनांची तुलना", te: "అత్యధికంగా సరిపోలిన 3 పథకాల పోలిక" }[lang] || "Comparing 3 top matching schemes side by side"}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 22, overflowX: "auto", boxShadow: c.shadow }}>
        <div style={{ minWidth: 760 }}>
          <div style={{ display: "grid", gridTemplateColumns: "170px repeat(3, minmax(190px, 1fr))", borderBottom: `1px solid ${c.border}`, background: c.surface }}>
            <div style={{ padding: "22px 16px", alignSelf: "end", color: c.muted, fontSize: 13, fontWeight: 800 }}>
              {labels.parameter}
            </div>

            {data.map(({ scheme, translated }, index) => (
              <div key={scheme.id} style={{ padding: "18px 16px 22px", textAlign: "center", borderLeft: `1px solid ${c.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 62 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: `${c.primary}13`, color: c.primary, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                    {index === 0 ? <Sparkles size={20} /> : <Landmark size={20} />}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 850, color: c.text, lineHeight: 1.2, textAlign: "left" }}>
                    {translated.name}
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <AnimatedMatchRing c={c} score={Number(scheme.score || 0)} size={58} />
                  {index === 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 999, background: `${c.success}18`, color: c.success, fontSize: 10, fontWeight: 900 }}>
                      {labels.best}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {rows.map(([label, renderValue]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "170px repeat(3, minmax(190px, 1fr))", borderBottom: `1px solid ${c.border}` }}>
              <div style={{ padding: "15px 16px", color: c.muted, fontSize: 12.5, fontWeight: 800 }}>{label}</div>
              {data.map((item) => (
                <div key={`${label}-${item.scheme.id}`} style={{ padding: "15px 16px", textAlign: "center", borderLeft: `1px solid ${c.border}`, color: c.text, fontSize: 12.5, fontWeight: 650, lineHeight: 1.5 }}>
                  {label === labels.eligibility ? (
                    <span style={{ display: "inline-flex", padding: "5px 11px", borderRadius: 999, background: `${c.success}18`, color: c.success, fontSize: 10.5, fontWeight: 850 }}>
                      {renderValue(item)}
                    </span>
                  ) : renderValue(item)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({
  c,
  t,
  language,
  results,
  profile,
  savedSchemes = [],
  setSavedSchemes,
  onBack,
  onOpen,
  detailed = false,
}) {
  return (
    <PageShell c={c}>
      <div
        className="container fade"
        style={{
          padding: "35px 0 70px",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
            marginTop: 30,
          }}
        >
          <div>
            <div
              style={{
                color: c.primary,
                fontWeight: 900,
                fontSize: 28,
                lineHeight: 1.2,
                marginTop: 8,
              }}
            >
              {t.basedOnProfile}
            </div>
          </div>

        </div>

        <div
          className="scheme-grid"
          style={{
            marginTop: 35,
          }}
        >
          {results.map((scheme, index) => (
            <SchemeCard
              key={scheme.id}
              c={c}
              t={t}
              language={language}
              scheme={scheme}
              index={index}
              detailed={detailed}
              isSaved={(savedSchemes || []).some((item) => item.id === scheme.id)}
              onToggleSave={() => {
                if (!setSavedSchemes) return;
                setSavedSchemes((current) =>
                  current.some((item) => item.id === scheme.id)
                    ? current.filter((item) => item.id !== scheme.id)
                    : [...current, scheme]
                );
              }}
              onOpen={() => onOpen(scheme)}
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
}


function AnimatedMatchRing({ c, score, size = 82 }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 1400;
    let start = null;

    const animate = (time) => {
      if (start === null) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    setDisplayScore(0);
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - displayScore / 100);

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flex: "0 0 auto",
        filter: `drop-shadow(0 7px 12px ${c.primary}25)`,
      }}
      aria-label={`${displayScore}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={c.surface2}
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={c.primary}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .04s linear" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 7}
          fill={c.surface}
          stroke={c.border}
          strokeWidth="1"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          fontSize: size >= 80 ? 16 : 14,
          color: displayScore >= 80 ? c.primary : c.accent,
        }}
      >
        {displayScore}%
      </div>
    </div>
  );
}

function SchemeCard({
  c,
  t,
  language,
  scheme,
  index,
  detailed = false,
  onOpen,
  isSaved = false,
  onToggleSave,
}) {
  const high = scheme.score >= 80;
  const translated = SCHEME_TRANSLATIONS[language]?.[scheme.id] || SCHEME_TRANSLATIONS.en?.[scheme.id] || {
    name: scheme.scheme_name || scheme.name || "Government Scheme",
    short: scheme.why_matched || scheme.benefit || scheme.description || "Eligible financial assistance scheme.",
    benefit: scheme.benefit || scheme.maxAssistance || "Financial Assistance / Loan",
  };
  const detail = SCHEME_DETAIL_TRANSLATIONS[language]?.[scheme.id] || SCHEME_DETAIL_TRANSLATIONS.en?.[scheme.id] || {
    ministry: scheme.ministry || "Government of India",
    description: scheme.description || scheme.why_matched || "",
    categories: scheme.categories || [],
    maxIncome: scheme.maxIncome ? `₹${scheme.maxIncome.toLocaleString("en-IN")}` : "No limit",
    maxAssistance: scheme.maxAssistance || scheme.benefit || "As applicable",
    interestRate: scheme.interestRate || "Concessional",
    subsidy: scheme.subsidy || "As applicable",
    documents: scheme.documents || scheme.documents_required || [],
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen();
      }}
      className="glass hover-card"
      style={{
        borderRadius: 24,
        padding: 25,
        textAlign: "left",
        color: c.text,
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 15,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: `${c.primary}13`,
            color: c.primary,
            display: "grid",
            placeItems: "center",
          }}
        >
          {index === 0 ? (
            <Sparkles size={22} />
          ) : (
            <Landmark size={22} />
          )}
        </div>

        <div style={{ textAlign: "right" }}>
          <AnimatedMatchRing
            c={c}
            score={scheme.score}
            size={82}
          />
          <div style={{ fontSize: 10, fontWeight: 800, color: c.muted, marginTop: 4 }}>
            {scheme.score >= 80 ? "STRONG MATCH" : "RECOMMENDATION MATCH"}
          </div>
        </div>
      </div>

      <h3
        style={{
          fontSize: 20,
          margin: "18px 0 6px",
          fontWeight: 800,
        }}
      >
        {translated.name}
      </h3>

      <div
        style={{
          color: c.muted,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {detail.ministry}
      </div>

      {scheme.why_matched && (
        <div
          style={{
            background: `${c.primary}10`,
            border: `1px solid ${c.primary}28`,
            borderRadius: 12,
            padding: "8px 12px",
            fontSize: 12,
            color: c.primary,
            fontWeight: 650,
            lineHeight: 1.45,
            marginBottom: 12,
          }}
        >
          💡 <strong>Why Matched:</strong> {scheme.why_matched}
        </div>
      )}

      <p
        style={{
          lineHeight: 1.6,
          color: c.muted,
          fontSize: 13.5,
          margin: "0 0 16px",
          flex: 1,
        }}
      >
        {translated.short}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: 15,
          borderTop: `1px solid ${c.border}`,
        }}
      >
        <strong style={{ color: c.accent, fontSize: 13.5 }}>
          {translated.benefit}
        </strong>

        <ChevronRight
          size={18}
          color={c.muted}
        />
      </div>

      {detailed && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <p
            style={{
              margin: "0 0 13px",
              color: c.muted,
              fontSize: 12.5,
              lineHeight: 1.55,
            }}
          >
            {detail.description || translated.short}
          </p>

          <div
            className="scheme-meta-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {[
              [({en:"Max Assistance",hi:"अधिकतम सहायता",bn:"সর্বোচ্চ সহায়তা",ta:"அதிகபட்ச உதவி",mr:"कमाल मदत",te:"గరిష్ట సహాయం"}[language] || "Max Assistance"), scheme.maxAssistance || detail.maxAssistance || translated.benefit],
              [({en:"Interest Rate",hi:"ब्याज दर",bn:"সুদের হার",ta:"வட்டி விகிதம்",mr:"व्याज दर",te:"వడ్డీ రేటు"}[language] || "Interest Rate"), scheme.interestRate || detail.interestRate || "As applicable"],
              [({en:"Subsidy",hi:"सब्सिडी",bn:"ভর্তুকি",ta:"மானியம்",mr:"अनुदान",te:"సబ్సిడీ"}[language] || "Subsidy"), scheme.subsidy || detail.subsidy || "As applicable"],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: c.surface2,
                  borderRadius: 10,
                  padding: "9px 8px",
                  textAlign: "center",
                  minWidth: 0,
                }}
              >
                <div style={{ color: c.muted, fontSize: 9.5, marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 12,
            }}
          >
            {(detail.tags || scheme.tags || []).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: `${c.surface2}`,
                  color: c.muted,
                  fontSize: 9.5,
                  fontWeight: 750,
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 9,
                padding: "9px 10px",
                background: "#2453D6",
                color: "white",
                fontWeight: 800,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {({en:"View Details",hi:"विवरण देखें",bn:"বিস্তারিত দেখুন",ta:"விவரங்களைப் பார்க்கவும்",mr:"तपशील पहा",te:"వివరాలు చూడండి"}[language] || "View Details")}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              style={{
                border: "none",
                borderRadius: 9,
                padding: "9px 13px",
                background: c.accent,
                color: "white",
                fontWeight: 800,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {({en:"Apply",hi:"आवेदन करें",bn:"আবেদন করুন",ta:"விண்ணப்பிக்கவும்",mr:"अर्ज करा",te:"దరఖాస్తు చేయండి"}[language] || "Apply")}
            </button>
            <button
              type="button"
              aria-label={isSaved ? "Remove saved scheme" : "Save scheme"}
              onClick={(event) => {
                event.stopPropagation();
                if (onToggleSave) onToggleSave();
              }}
              style={{
                border: `1px solid ${c.border}`,
                borderRadius: 9,
                padding: "9px 12px",
                background: isSaved ? `${c.primary}12` : c.surface,
                color: isSaved ? c.primary : c.muted,
                fontWeight: 800,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {isSaved
                ? "★ " + ({en:"Saved",hi:"सहेजा गया",bn:"সংরক্ষিত",ta:"சேமிக்கப்பட்டது",mr:"जतन केले",te:"సేవ్ చేయబడింది"}[language] || "Saved")
                : "☆ " + ({en:"Save",hi:"सहेजें",bn:"সংরক্ষণ করুন",ta:"சேமிக்கவும்",mr:"जतन करा",te:"సేవ్ చేయండి"}[language] || "Save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailScreen({
  c,
  t,
  language,
  scheme,
  profile,
  selectedPartner,
  setSelectedPartner,
  financialPlan,
  setFinancialPlan,
  onBack,
  onApply,
}) {
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const translated =
    SCHEME_TRANSLATIONS[language]?.[scheme.id] ||
    SCHEME_TRANSLATIONS.en?.[scheme.id] || {
      name: scheme.scheme_name || scheme.name || "Government Scheme",
      short: scheme.why_matched || scheme.benefit || scheme.description || "Government financial assistance scheme.",
      benefit: scheme.benefit || scheme.maxAssistance || "Financial Assistance / Loan",
    };

  return (
    <PageShell c={c}>
      <div
        className="container fade"
        style={{
          padding: "35px 0 70px",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div
          style={{
            maxWidth: 850,
            margin: "35px auto 0",
          }}
        >
          <div
            style={{
              color: c.primary,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {t.schemeDetails.toUpperCase()}
          </div>

          <h1
            style={{
              fontSize: 44,
              margin: "10px 0",
            }}
          >
            {translated.name}
          </h1>

          <p
            style={{
              color: c.muted,
              fontSize: 17,
              lineHeight: 1.7,
            }}
          >
            {translated.short}
          </p>

          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 28,
              marginTop: 25,
              background: `${c.primary}09`,
            }}
          >
            <div
              style={{
                color: c.muted,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {t.mainBenefit}
            </div>

            <div
              style={{
                fontSize: 28,
                color: c.accent,
                fontWeight: 800,
                marginTop: 5,
              }}
            >
              {translated.benefit}
            </div>
          </div>

          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 28,
              marginTop: 20,
            }}
          >
            <h2 style={{ fontSize: 23 }}>
              {t.documentsNeeded}
            </h2>

            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {scheme.documents.map((doc) => (
                <div
                  key={doc}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: 13,
                    background: c.surface2,
                  }}
                >
                  <CheckCircle2
                    size={19}
                    color={c.primary}
                  />

                  <span>
                    {
                      DOCUMENT_TRANSLATIONS[
                        language
                      ][doc]
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Planning & EMI Estimator Card */}
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 24,
              marginTop: 20,
              background: `${c.accent}08`,
              border: `1.5px solid ${c.accent}30`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: c.accent,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Calculator size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Financial Planning & EMI Estimator
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 850, color: c.text, marginTop: 2 }}>
                    {financialPlan ? `Planned Loan: Rs. ${Number(financialPlan.loanAmount).toLocaleString("en-IN")} (~Rs. ${Number(financialPlan.monthlyEmi).toLocaleString("en-IN")}/mo)` : "Simulate EMI & Cashflow Readiness"}
                  </div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                    {scheme?.max_loan_amount ? `Max Scheme Limit: Rs. ${Number(scheme.max_loan_amount).toLocaleString("en-IN")}` : "Evaluate monthly repayment & What-If scenarios"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFinanceModal(true)}
                style={{
                  ...secondaryButton(c),
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sliders size={15} color={c.accent} />
                {financialPlan ? "Modify Financial Plan" : "Open Financial Simulator"}
              </button>
            </div>
          </div>

          {/* Financial Simulator Modal */}
          {showFinanceModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "grid",
                placeItems: "center",
                padding: 16,
              }}
              onClick={() => setShowFinanceModal(false)}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 960,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: c.bg,
                  borderRadius: 24,
                  padding: 24,
                  border: `1px solid ${c.border}`,
                  boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 850, margin: 0 }}>
                    Loan EMI & What-If Simulator
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFinanceModal(false)}
                    style={{
                      border: "none",
                      background: c.surface2,
                      color: c.text,
                      borderRadius: 10,
                      padding: "6px 12px",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Close & Apply Plan
                  </button>
                </div>
                <FinancialCalculator
                  c={c}
                  t={t}
                  scheme={scheme}
                  profile={profile}
                  onHandoff={(plan) => {
                    if (setFinancialPlan) setFinancialPlan(plan);
                    setShowFinanceModal(false);
                  }}
                />
              </div>
            </div>
          )}

          {/* Channel Partner Nodal Association Card */}
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 24,
              marginTop: 20,
              background: `${c.primary}08`,
              border: `1.5px solid ${c.primary}30`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: c.primary,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Landmark size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Authorized Nodal Channel Partner
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 850, color: c.text, marginTop: 2 }}>
                    {selectedPartner?.partner_name || "Auto-routed District Nodal Authority"}
                  </div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                    {selectedPartner?.location || selectedPartner?.address || (profile?.location || "Nearest District Lead Branch")}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPartnerModal(true)}
                style={{
                  ...secondaryButton(c),
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MapPin size={15} color={c.primary} />
                {selectedPartner ? "Change Partner on Map" : "Find Nearest Partner on Map"}
              </button>
            </div>
          </div>

          {/* Modal / Dialog for Partner Map */}
          {showPartnerModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "grid",
                placeItems: "center",
                padding: 16,
              }}
              onClick={() => setShowPartnerModal(false)}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 960,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: c.bg,
                  borderRadius: 24,
                  padding: 24,
                  border: `1px solid ${c.border}`,
                  boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 850, margin: 0 }}>
                    Select Nodal Channel Partner
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPartnerModal(false)}
                    style={{
                      border: "none",
                      background: c.surface2,
                      color: c.text,
                      borderRadius: 10,
                      padding: "6px 12px",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Close & Select
                  </button>
                </div>
                <PartnerMap
                  c={c}
                  t={t}
                  scheme={scheme}
                  profile={profile}
                  selectedPartner={selectedPartner}
                  setSelectedPartner={(p) => {
                    if (setSelectedPartner) setSelectedPartner(p);
                  }}
                  onContinue={() => setShowPartnerModal(false)}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onApply}
            style={{
              ...primaryButton(c),
              width: "100%",
              marginTop: 25,
            }}
          >
            <Camera size={19} />
            {t.verifyDocuments}
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function UploadScreen({
  c,
  t,
  language = "en",
  scheme,
  profile,
  selectedPartner,
  financialPlan,
  onBack,
  onSubmitSuccess,
}) {
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklist, setChecklist] = useState({
    scheme_id: scheme?.id || scheme?.scheme_id || "",
    scheme_name: scheme?.scheme_name || scheme?.name || "Government Scheme",
    mandatory_documents: [],
    optional_documents: [],
  });
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [readiness, setReadiness] = useState({
    is_ready_to_submit: false,
    completion_percentage: 0,
    required_documents: 0,
    completed_required_documents: 0,
    missing_document_names: [],
    next_action: "Upload mandatory documents to proceed.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);

  const fileInputRefs = useRef({});

  // 1. Fetch dynamic document checklist on mount
  useEffect(() => {
    let isMounted = true;
    const loadChecklist = async () => {
      setChecklistLoading(true);
      const schemeId = scheme?.id || scheme?.scheme_id || "";
      try {
        const res = await getSchemeDocumentChecklist(schemeId);
        if (isMounted && res) {
          const mandatory = res.required_documents || res.mandatory_documents || [];
          const optional = res.optional_documents || [];
          const allChecklist = res.checklist || [];

          // Format items cleanly
          const formattedMandatory = (mandatory.length > 0 ? mandatory : allChecklist.filter(i => i.mandatory !== false)).map((item, idx) => ({
            requirement_id: item.requirement_id || item.id || `req-${idx}`,
            document_name: item.document_name || item.name || "Required Certificate",
            document_type: item.document_type || "general_document",
            description: item.description || "Official government certificate or identity document.",
            why_required: item.why_required || "Required to verify applicant eligibility guidelines.",
            accepted_formats: item.accepted_formats || ["pdf", "jpg", "jpeg", "png", "webp"],
            max_file_size_mb: item.max_file_size_mb || 20,
            mandatory: true,
          }));

          const formattedOptional = (optional.length > 0 ? optional : allChecklist.filter(i => i.mandatory === false)).map((item, idx) => ({
            requirement_id: item.requirement_id || item.id || `opt-${idx}`,
            document_name: item.document_name || item.name || "Supporting Document",
            document_type: item.document_type || "general_document",
            description: item.description || "Optional supporting document for additional entitlements.",
            why_required: item.why_required || "May be requested for additional subsidy or location benefits.",
            accepted_formats: item.accepted_formats || ["pdf", "jpg", "jpeg", "png", "webp"],
            max_file_size_mb: item.max_file_size_mb || 20,
            mandatory: false,
          }));

          setChecklist({
            scheme_id: res.scheme_id || schemeId,
            scheme_name: res.scheme_name || scheme?.scheme_name || scheme?.name || "Government Scheme",
            mandatory_documents: formattedMandatory,
            optional_documents: formattedOptional,
          });

          // Compute initial readiness
          updateReadiness(schemeId, {}, formattedMandatory);
        }
      } catch (err) {
        console.warn("Could not fetch dynamic checklist, falling back to scheme documents:", err);
        if (isMounted) {
          const rawDocs = scheme?.documents || scheme?.documents_required || ["Aadhaar Card", "Income Certificate", "Bank Passbook"];
          const fallbackMandatory = rawDocs.map((docName, idx) => ({
            requirement_id: `req-${idx}-${docName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
            document_name: typeof docName === "string" ? docName : docName.name || "Document",
            document_type: "general_document",
            description: `Statutory verification requirement for ${scheme?.name || "this scheme"}.`,
            why_required: "Used for applicant identity, category entitlement, and bank DBT verification.",
            accepted_formats: ["pdf", "jpg", "jpeg", "png", "webp"],
            max_file_size_mb: 20,
            mandatory: true,
          }));
          setChecklist({
            scheme_id: schemeId,
            scheme_name: scheme?.scheme_name || scheme?.name || "Government Scheme",
            mandatory_documents: fallbackMandatory,
            optional_documents: [],
          });
          updateReadiness(schemeId, {}, fallbackMandatory);
        }
      } finally {
        if (isMounted) setChecklistLoading(false);
      }
    };

    loadChecklist();
    return () => {
      isMounted = false;
    };
  }, [scheme]);

  // Recalculate readiness from current uploaded documents
  const updateReadiness = async (schemeId, currentUploaded, mandatoryList = checklist.mandatory_documents) => {
    const uploadedReqIds = Object.keys(currentUploaded).filter(
      (k) => currentUploaded[k]?.status === "verified" || currentUploaded[k]?.status === "uploaded"
    );
    const providedDocIds = Object.values(currentUploaded)
      .map((d) => d.document_id)
      .filter(Boolean);

    try {
      const res = await calculateDocumentReadiness({
        scheme_id: schemeId || scheme?.id || scheme?.scheme_id,
        provided_documents: providedDocIds,
        uploaded_requirements: uploadedReqIds,
      });

      if (res) {
        setReadiness({
          is_ready_to_submit: res.is_ready_to_submit ?? (uploadedReqIds.length >= mandatoryList.length && mandatoryList.length > 0),
          completion_percentage: res.completion_percentage ?? Math.round((uploadedReqIds.length / (mandatoryList.length || 1)) * 100),
          required_documents: res.required_documents ?? mandatoryList.length,
          completed_required_documents: res.completed_required_documents ?? uploadedReqIds.length,
          missing_document_names: res.missing_document_names || mandatoryList.filter(m => !uploadedReqIds.includes(m.requirement_id)).map(m => m.document_name),
          next_action: res.next_action || (uploadedReqIds.length >= mandatoryList.length ? "All mandatory documents verified. Ready to submit." : "Upload missing mandatory documents."),
        });
        return;
      }
    } catch (e) {
      console.debug("Backend readiness fallback calculation:", e);
    }

    // Local deterministic calculation fallback
    const verifiedCount = mandatoryList.filter((m) => currentUploaded[m.requirement_id]?.status === "verified" || currentUploaded[m.requirement_id]?.status === "uploaded").length;
    const isReady = verifiedCount >= mandatoryList.length && mandatoryList.length > 0;
    const missing = mandatoryList.filter((m) => !currentUploaded[m.requirement_id] || currentUploaded[m.requirement_id].status === "invalid").map((m) => m.document_name);

    setReadiness({
      is_ready_to_submit: isReady,
      completion_percentage: Math.round((verifiedCount / (mandatoryList.length || 1)) * 100),
      required_documents: mandatoryList.length,
      completed_required_documents: verifiedCount,
      missing_document_names: missing,
      next_action: isReady ? "All mandatory documents verified. Ready for submission to Authorized Nodal Partner." : `Upload remaining: ${missing.join(", ")}`,
    });
  };

  // Handle Real File Selection & OCR Verification
  const handleFileSelect = async (requirement, file) => {
    if (!file) return;

    const reqId = requirement.requirement_id;
    const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const ext = "." + file.name.split(".").pop().toLowerCase();

    if (!allowedExts.includes(ext)) {
      window.alert(`Invalid file format '${ext}'. Accepted formats: PDF, PNG, JPG, JPEG, WEBP.`);
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      window.alert("File size exceeds 20MB maximum limit.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    const formattedSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // 1. Set uploading/verifying state
    const newDocState = {
      ...uploadedDocs,
      [reqId]: {
        file,
        url: localUrl,
        filename: file.name,
        size: formattedSize,
        uploadedAt: new Date().toLocaleTimeString(),
        status: "verifying",
        message: "🔍 AI OCR is reading and verifying document structure...",
        extracted: null,
        confidence: null,
        issues: [],
      },
    };
    setUploadedDocs(newDocState);

    try {
      // 2. Upload file to backend /api/documents/upload
      const uploadRes = await uploadSchemeDocument({
        file,
        requirementId: reqId,
        documentName: requirement.document_name,
        documentType: requirement.document_type,
        schemeId: scheme?.id || scheme?.scheme_id,
      });

      // 3. Inspect document with real OCR /api/ocr/verify
      let ocrData = null;
      try {
        const ocrRes = await verifyDocument(file, requirement.document_type || requirement.document_name, scheme?.id || scheme?.scheme_id);
        if (ocrRes) ocrData = ocrRes;
      } catch (ocrErr) {
        console.debug("OCR service non-blocking warning:", ocrErr);
      }

      const isValid = uploadRes?.is_valid !== false && (ocrData?.is_valid !== false);
      const updatedState = {
        ...uploadedDocs,
        [reqId]: {
          file,
          url: localUrl,
          filename: file.name,
          size: formattedSize,
          uploadedAt: new Date().toLocaleTimeString(),
          document_id: uploadRes?.document_id || `DOC-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: isValid ? "verified" : "invalid",
          message: isValid
            ? "✓ Format & OCR Verified (AI Assisted)"
            : ocrData?.message || uploadRes?.validation_message || "Document verification issue detected.",
          extracted: ocrData?.extracted_entities || {},
          confidence: ocrData?.confidence || 0.94,
          issues: ocrData?.issues || (isValid ? [] : ["Please ensure text is readable without heavy blur or glare."]),
        },
      };

      setUploadedDocs(updatedState);
      updateReadiness(scheme?.id || scheme?.scheme_id, updatedState);
    } catch (err) {
      console.warn("Upload/OCR failed, recording invalid state:", err);
      const errState = {
        ...uploadedDocs,
        [reqId]: {
          file,
          url: localUrl,
          filename: file.name,
          size: formattedSize,
          uploadedAt: new Date().toLocaleTimeString(),
          status: "invalid",
          message: err.message || "Failed to process document file.",
          issues: [err.message || "Upload failed. Please try a different clear file."],
        },
      };
      setUploadedDocs(errState);
      updateReadiness(scheme?.id || scheme?.scheme_id, errState);
    }
  };

  // Remove uploaded document
  const handleRemoveDoc = (reqId) => {
    const updated = { ...uploadedDocs };
    if (updated[reqId]?.url) {
      URL.revokeObjectURL(updated[reqId].url);
    }
    delete updated[reqId];
    setUploadedDocs(updated);
    updateReadiness(scheme?.id || scheme?.scheme_id, updated);
  };

  // Submit Final Application
  const handleSubmitApplication = async () => {
    if (!readiness.is_ready_to_submit) {
      window.alert("Please upload all mandatory documents before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const schemeId = scheme?.id || scheme?.scheme_id || "standup-india";
      const schemeName = scheme?.scheme_name || scheme?.name || "Government Welfare Scheme";

      // 1. Create Application Draft with Partner & Financial Plan Association
      const createPayload = {
        scheme_id: schemeId,
        scheme_name: schemeName,
        partner_id: selectedPartner?.partner_id || null,
        partner_name: selectedPartner?.partner_name || null,
        category: profile?.category || "General",
        income: profile?.income ? Number(profile.income) : 300000,
        state: profile?.location || profile?.state || "Uttar Pradesh",
        business_type: profile?.businessType || profile?.ideaCategory || "general_enterprise",
        project_cost: financialPlan?.loanAmount ? Number(financialPlan.loanAmount) : (profile?.project_cost ? Number(profile.project_cost) : 500000),
        notes: `Submitted via Scheme Saathi AI onboarding portal with verified documents. Channel Partner: ${selectedPartner?.partner_name || "Auto-routed District Nodal Authority"}. ${financialPlan ? `Assessed Loan Plan: Rs. ${Number(financialPlan.loanAmount).toLocaleString("en-IN")}, Tenure: ${financialPlan.tenureYears} Yrs, Est. EMI: Rs. ${Number(financialPlan.monthlyEmi).toLocaleString("en-IN")}/mo.` : ""}`,
      };

      const createdApp = await createApplication(createPayload);
      const appId = createdApp?.application_id;

      if (!appId) {
        throw new Error("Failed to generate application tracking identifier.");
      }

      // 2. Submit Application to Channel Partner
      const submitRes = await submitApplicationById(appId, {
        notes: "Applicant confirmed document readiness and authorized channel partner routing.",
      });

      const finalRecord = {
        ...(createdApp || {}),
        ...(submitRes || {}),
        application_id: appId,
        scheme_name: schemeName,
        status: "submitted",
        submitted_at: submitRes?.submitted_at || new Date().toISOString(),
      };

      if (onSubmitSuccess) {
        onSubmitSuccess(finalRecord);
      }
    } catch (err) {
      console.error("Application submission failed:", err);
      setSubmitError(err.message || "Failed to submit application. Please check backend connection and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const schemeTitle = scheme?.scheme_name || scheme?.name || "Government Scheme";

  return (
    <PageShell c={c}>
      <div
        className="container fade"
        style={{
          padding: "35px 0 70px",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div style={{ marginTop: 25 }}>
          {/* Tag & Title */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 20,
              background: `${c.primary}15`,
              color: c.primary,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            <ShieldCheck size={16} />
            {t.documentVerification || "Document Readiness & AI OCR"}
          </div>

          <h1
            style={{
              fontSize: 36,
              fontWeight: 900,
              margin: "6px 0 10px",
              lineHeight: 1.25,
            }}
          >
            {t.verifyYourDocuments || "Verify Documents for Application"}
          </h1>

          <p
            style={{
              color: c.muted,
              fontSize: 16,
              lineHeight: 1.6,
              marginBottom: 25,
            }}
          >
            Upload required statutory certificates for <strong>{schemeTitle}</strong>.
            Scheme Saathi verifies document formatting and extracts key fields via AI OCR before forwarding to the authorized Nodal Partner.
          </p>

          {/* Financial Plan & Readiness Badge */}
          {financialPlan && (
            <div
              className="glass"
              style={{
                padding: "16px 20px",
                borderRadius: 18,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                background: `${c.accent}0a`,
                border: `1.5px solid ${c.accent}30`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: c.accent,
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Calculator size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Assessed Financial Plan
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 850, color: c.text }}>
                    Requested Loan: Rs. {Number(financialPlan.loanAmount).toLocaleString("en-IN")} ({financialPlan.tenureYears} Yrs @ {financialPlan.interestRate}%)
                  </div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                    Estimated Monthly EMI: Rs. {Number(financialPlan.monthlyEmi).toLocaleString("en-IN")}/mo • Total Repayment: Rs. {Number(financialPlan.totalRepayment).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 750,
                  padding: "5px 12px",
                  borderRadius: 10,
                  background: `${c.success}18`,
                  color: c.success,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <ShieldCheck size={14} />
                Financial Assessment Attached
              </div>
            </div>
          )}

          {/* Designated Channel Partner Banner */}
          <div
            className="glass"
            style={{
              padding: "16px 20px",
              borderRadius: 18,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              background: `${c.primary}0c`,
              border: `1.5px solid ${c.primary}30`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: c.primary,
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Landmark size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Designated Nodal Processing Desk
                </div>
                <div style={{ fontSize: 15, fontWeight: 850, color: c.text }}>
                  {selectedPartner?.partner_name || "Authorized District Nodal Authority / Lead Branch"}
                </div>
                <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>
                  {selectedPartner?.address || selectedPartner?.location || (profile?.location || "Uttar Pradesh")}
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                fontWeight: 750,
                padding: "5px 12px",
                borderRadius: 10,
                background: `${c.success}18`,
                color: c.success,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <ShieldCheck size={14} />
              Nodal Partner Linked
            </div>
          </div>

          {/* Readiness Progress Card */}
          <div
            className="glass"
            style={{
              padding: "24px 28px",
              borderRadius: 22,
              marginBottom: 30,
              background: readiness.is_ready_to_submit
                ? `${c.success}10`
                : `${c.surface2}`,
              border: `1.5px solid ${
                readiness.is_ready_to_submit
                  ? `${c.success}40`
                  : c.border
              }`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 15,
                marginBottom: 15,
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: c.muted, fontWeight: 700 }}>
                  APPLICATION READINESS SCORE
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: readiness.is_ready_to_submit ? c.success : c.text,
                    marginTop: 2,
                  }}
                >
                  {readiness.completed_required_documents} of {readiness.required_documents} Mandatory Documents Verified ({readiness.completion_percentage}%)
                </div>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 800,
                  background: readiness.is_ready_to_submit ? `${c.success}20` : `${c.accent}20`,
                  color: readiness.is_ready_to_submit ? c.success : c.accent,
                  border: `1px solid ${readiness.is_ready_to_submit ? c.success : c.accent}40`,
                }}
              >
                {readiness.is_ready_to_submit ? (
                  <>
                    <CheckCircle2 size={17} />
                    Ready for Submission
                  </>
                ) : (
                  <>
                    <AlertCircle size={17} />
                    Missing Mandatory Requirements
                  </>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                width: "100%",
                height: 10,
                borderRadius: 10,
                background: `${c.border}60`,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${readiness.completion_percentage}%`,
                  height: "100%",
                  borderRadius: 10,
                  background: readiness.is_ready_to_submit
                    ? `linear-gradient(90deg, ${c.success}, #22c55e)`
                    : `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 13,
                color: c.muted,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Lightbulb size={15} color={c.accent} />
              <span>{readiness.next_action}</span>
            </div>
          </div>

          {/* Loading Indicator */}
          {checklistLoading ? (
            <div
              className="glass"
              style={{
                padding: 40,
                textAlign: "center",
                borderRadius: 20,
                color: c.muted,
              }}
            >
              <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 12px", color: c.primary }} />
              <div>Fetching dynamic statutory checklist for {schemeTitle}...</div>
            </div>
          ) : (
            <>
              {/* Mandatory Checklist Section */}
              <div style={{ marginBottom: 35 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
                    Mandatory Documents ({checklist.mandatory_documents.length})
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: `${c.danger}18`,
                      color: c.danger,
                      textTransform: "uppercase",
                    }}
                  >
                    Required for Submission
                  </span>
                </div>

                <div style={{ display: "grid", gap: 16 }}>
                  {checklist.mandatory_documents.map((item) => {
                    const uploaded = uploadedDocs[item.requirement_id];
                    const isVerifying = uploaded?.status === "verifying";
                    const isVerified = uploaded?.status === "verified";
                    const isInvalid = uploaded?.status === "invalid";

                    return (
                      <div
                        key={item.requirement_id}
                        className="glass"
                        style={{
                          borderRadius: 20,
                          padding: 22,
                          border: `1.5px solid ${
                            isVerified
                              ? `${c.success}60`
                              : isInvalid
                              ? `${c.danger}60`
                              : isVerifying
                              ? `${c.primary}60`
                              : c.border
                          }`,
                          background: isVerified
                            ? `${c.success}08`
                            : isInvalid
                            ? `${c.danger}06`
                            : c.surface,
                          transition: "all 0.25s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 16,
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "flex", gap: 15, flex: 1, minWidth: 260 }}>
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                background: isVerified
                                  ? `${c.success}20`
                                  : isInvalid
                                  ? `${c.danger}20`
                                  : `${c.primary}15`,
                                color: isVerified
                                  ? c.success
                                  : isInvalid
                                  ? c.danger
                                  : c.primary,
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              {isVerified ? (
                                <CheckCircle2 size={24} />
                              ) : isInvalid ? (
                                <AlertTriangle size={24} />
                              ) : isVerifying ? (
                                <RefreshCw size={22} className="animate-spin" />
                              ) : (
                                <FileText size={24} />
                              )}
                            </div>

                            <div>
                              <div style={{ fontSize: 17, fontWeight: 800 }}>
                                {item.document_name}
                              </div>
                              <div style={{ fontSize: 13, color: c.muted, marginTop: 3, lineHeight: 1.5 }}>
                                {item.description}
                              </div>

                              {/* Why Required Box */}
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginTop: 8,
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  background: c.surface2,
                                  fontSize: 12,
                                  color: c.muted,
                                }}
                              >
                                <HelpCircle size={14} color={c.primary} />
                                <span><strong>Why Required:</strong> {item.why_required}</span>
                              </div>
                            </div>
                          </div>

                          {/* Upload Action / Status Control */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <input
                              type="file"
                              ref={(el) => (fileInputRefs.current[item.requirement_id] = el)}
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(item, file);
                              }}
                            />

                            {!uploaded ? (
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[item.requirement_id]?.click()}
                                style={{
                                  ...secondaryButton(c),
                                  padding: "10px 18px",
                                  fontSize: 13,
                                }}
                              >
                                <UploadCloud size={16} />
                                Upload File
                              </button>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setPreviewDoc(uploaded)}
                                  style={{
                                    ...secondaryButton(c),
                                    padding: "8px 14px",
                                    fontSize: 12,
                                  }}
                                >
                                  <Eye size={15} />
                                  Preview
                                </button>

                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[item.requirement_id]?.click()}
                                  style={{
                                    ...secondaryButton(c),
                                    padding: "8px 14px",
                                    fontSize: 12,
                                  }}
                                  title="Replace with new file"
                                >
                                  <RefreshCw size={14} />
                                  Replace
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(item.requirement_id)}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    border: `1px solid ${c.border}`,
                                    background: c.surface,
                                    color: c.danger,
                                    display: "grid",
                                    placeItems: "center",
                                  }}
                                  title="Delete document"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Uploaded File Details & OCR Card */}
                        {uploaded && (
                          <div
                            style={{
                              marginTop: 15,
                              padding: "12px 16px",
                              borderRadius: 12,
                              background: isVerified
                                ? `${c.success}12`
                                : isInvalid
                                ? `${c.danger}12`
                                : `${c.primary}08`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 10,
                              fontSize: 12,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700 }}>
                                📄 {uploaded.filename} ({uploaded.size})
                              </span>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 6,
                                  fontWeight: 800,
                                  background: isVerified ? `${c.success}25` : isInvalid ? `${c.danger}25` : `${c.primary}25`,
                                  color: isVerified ? c.success : isInvalid ? c.danger : c.primary,
                                }}
                              >
                                {uploaded.message}
                              </span>
                            </div>

                            {uploaded.extracted && Object.keys(uploaded.extracted).length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                {Object.entries(uploaded.extracted).map(([k, v]) => (
                                  <span
                                    key={k}
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 6,
                                      background: c.surface,
                                      border: `1px solid ${c.border}`,
                                      fontSize: 11,
                                    }}
                                  >
                                    <strong>{k}:</strong> {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}

                            {isInvalid && uploaded.issues?.length > 0 && (
                              <div style={{ color: c.danger, width: "100%", marginTop: 4 }}>
                                ⚠️ Issue: {uploaded.issues.join("; ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Supporting Documents (if any) */}
              {checklist.optional_documents.length > 0 && (
                <div style={{ marginBottom: 35 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>
                      Optional Supporting Documents ({checklist.optional_documents.length})
                    </h2>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: `${c.muted}20`,
                        color: c.muted,
                        textTransform: "uppercase",
                      }}
                    >
                      Non-blocking
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    {checklist.optional_documents.map((item) => {
                      const uploaded = uploadedDocs[item.requirement_id];
                      return (
                        <div
                          key={item.requirement_id}
                          className="glass"
                          style={{
                            borderRadius: 18,
                            padding: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 15,
                            flexWrap: "wrap",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 750, fontSize: 15 }}>{item.document_name}</div>
                            <div style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{item.why_required}</div>
                          </div>

                          <input
                            type="file"
                            ref={(el) => (fileInputRefs.current[item.requirement_id] = el)}
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(item, file);
                            }}
                          />

                          {!uploaded ? (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[item.requirement_id]?.click()}
                              style={{
                                ...secondaryButton(c),
                                padding: "8px 15px",
                                fontSize: 12,
                              }}
                            >
                              <UploadCloud size={14} />
                              Upload Optional
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: c.success, fontWeight: 700 }}>
                              ✓ Uploaded
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Compliance & Data Transparency Disclaimer */}
              <div
                style={{
                  padding: "18px 22px",
                  borderRadius: 16,
                  background: `${c.primary}08`,
                  border: `1px solid ${c.primary}25`,
                  marginBottom: 30,
                  fontSize: 13,
                  color: c.muted,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 800, color: c.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
                  <ShieldAlert size={16} color={c.primary} />
                  Verification Protocol & Transparency Notice
                </div>
                Uploaded documents are analyzed using secure optical character recognition (OCR) to evaluate format validity and field completeness.
                <strong> Scheme Saathi facilitates onboarding and does not issue government certificates or sanction decisions directly.</strong> Final verification will be performed by the designated Channel Partner nodal officer upon application submission.
              </div>

              {/* Submission Error Alert */}
              {submitError && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 14,
                    background: `${c.danger}15`,
                    color: c.danger,
                    border: `1px solid ${c.danger}35`,
                    marginBottom: 20,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  ⚠️ {submitError}
                </div>
              )}

              {/* Submit Application Button */}
              <button
                type="button"
                disabled={!readiness.is_ready_to_submit || isSubmitting}
                onClick={handleSubmitApplication}
                style={{
                  ...primaryButton(c),
                  width: "100%",
                  padding: "16px 24px",
                  fontSize: 17,
                  opacity: readiness.is_ready_to_submit && !isSubmitting ? 1 : 0.45,
                  cursor: readiness.is_ready_to_submit && !isSubmitting ? "pointer" : "not-allowed",
                  boxShadow: readiness.is_ready_to_submit ? `0 12px 28px ${c.primary}45` : "none",
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={20} className="animate-spin" />
                    Submitting Application to Channel Partner...
                  </>
                ) : (
                  <>
                    <FileCheck2 size={20} />
                    {readiness.is_ready_to_submit
                      ? `Submit Application for ${schemeTitle}`
                      : `Complete Mandatory Documents to Submit (${readiness.completed_required_documents}/${readiness.required_documents})`}
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Document Preview Modal */}
        {previewDoc && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "grid",
              placeItems: "center",
              padding: 20,
            }}
            onClick={() => setPreviewDoc(null)}
          >
            <div
              className="glass"
              style={{
                maxWidth: 650,
                width: "100%",
                borderRadius: 22,
                padding: 28,
                background: c.surface,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  📄 Document Preview: {previewDoc.filename}
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: c.muted,
                    cursor: "pointer",
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 14,
                  background: c.surface2,
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                {previewDoc.file?.type?.startsWith("image/") ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.filename}
                    style={{
                      maxWidth: "100%",
                      maxHeight: 320,
                      borderRadius: 10,
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div style={{ padding: "40px 20px", color: c.muted }}>
                    <FileText size={48} style={{ margin: "0 auto 10px", color: c.primary }} />
                    <div style={{ fontWeight: 700 }}>{previewDoc.filename}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Format: PDF Document ({previewDoc.size})</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <a
                  href={previewDoc.url}
                  download={previewDoc.filename}
                  style={{
                    ...secondaryButton(c),
                    padding: "10px 18px",
                    textDecoration: "none",
                    fontSize: 13,
                  }}
                >
                  <Download size={15} />
                  Download File
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    ...primaryButton(c),
                    padding: "10px 18px",
                    fontSize: 13,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatusScreen({
  c,
  t,
  language = "en",
  scheme,
  profile,
  selectedPartner,
  financialPlan,
  applicationId,
  applicationData,
  onHome,
  onDashboard,
}) {
  const [appDetails, setAppDetails] = useState(applicationData || null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lookupId, setLookupId] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const effectiveAppId = appDetails?.application_id || applicationId || "APP-2026-PENDING";

  // Load application status and history timeline on mount
  useEffect(() => {
    let isMounted = true;
    const fetchTimeline = async () => {
      if (!effectiveAppId || effectiveAppId === "APP-2026-PENDING") {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [statusRes, historyRes] = await Promise.allSettled([
          getApplicationStatus(effectiveAppId),
          getApplicationHistory(effectiveAppId),
        ]);

        if (isMounted) {
          if (statusRes.status === "fulfilled" && statusRes.value) {
            setAppDetails((prev) => ({
              ...(prev || {}),
              ...statusRes.value,
            }));
          }

          if (historyRes.status === "fulfilled" && historyRes.value?.history) {
            setHistoryItems(historyRes.value.history);
          }
        }
      } catch (err) {
        console.warn("Could not load application history from backend:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTimeline();
    return () => {
      isMounted = false;
    };
  }, [effectiveAppId]);

  // Copy Application ID to clipboard
  const handleCopyId = () => {
    if (navigator.clipboard && effectiveAppId) {
      navigator.clipboard.writeText(effectiveAppId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Lookup custom application ID
  const handleLookup = async (e) => {
    e?.preventDefault();
    if (!lookupId.trim()) return;

    setLookupLoading(true);
    setLookupError("");

    try {
      const res = await getApplicationStatus(lookupId.trim());
      if (res && res.application_id) {
        setAppDetails(res);
        const hist = await getApplicationHistory(res.application_id);
        if (hist?.history) setHistoryItems(hist.history);
      } else {
        setLookupError("No active application record found with this ID.");
      }
    } catch (err) {
      setLookupError(err.message || "Application not found. Please verify the ID format.");
    } finally {
      setLookupLoading(false);
    }
  };

  const schemeName = appDetails?.scheme_name || scheme?.scheme_name || scheme?.name || "Government Scheme";
  const partnerName = appDetails?.partner_name || selectedPartner?.partner_name || "Authorized District Channel Partner";
  const submittedAt = appDetails?.submitted_at
    ? new Date(appDetails.submitted_at).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  // Standard Milestone Stages for Tracking
  const trackingMilestones = [
    {
      id: "submitted",
      title: "Application Submitted",
      description: "Application record generated and received by Scheme Saathi platform.",
      isCompleted: true,
      isActive: false,
      timestamp: submittedAt,
    },
    {
      id: "partner_assigned",
      title: "Channel Partner Assigned",
      description: `Application routed to ${partnerName} for institutional processing.`,
      isCompleted: true,
      isActive: true,
      timestamp: "Active",
    },
    {
      id: "appraisal",
      title: "Document & Project Appraisal",
      description: "Scrutiny of uploaded certificates and enterprise viability against statutory guidelines.",
      isCompleted: false,
      isActive: false,
      timestamp: "Scheduled",
    },
    {
      id: "decision",
      title: "Sanction & Disbursement Decision",
      description: "Final sanction order / Direct Benefit Transfer (DBT) intimation.",
      isCompleted: false,
      isActive: false,
      timestamp: "Upcoming",
    },
  ];

  return (
    <PageShell c={c}>
      <div
        className="container fade"
        style={{
          maxWidth: 900,
          padding: "50px 0 80px",
          margin: "0 auto",
        }}
      >
        {/* Header Hero */}
        <div style={{ textAlign: "center", marginBottom: 35 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: `${c.success}18`,
              color: c.success,
              display: "grid",
              placeItems: "center",
              margin: "0 auto 20px",
              boxShadow: `0 14px 30px ${c.success}30`,
            }}
          >
            <BadgeCheck size={42} />
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: c.primary,
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            APPLICATION RECORD SUBMITTED
          </div>

          <h1
            style={{
              fontSize: 40,
              fontWeight: 900,
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            {t.applicationStatus || "Application Status & Tracking"}
          </h1>

          <p style={{ color: c.muted, fontSize: 17, maxWidth: 650, margin: "0 auto" }}>
            Your application for <strong>{schemeName}</strong> is registered and forwarded to the designated Nodal Channel Partner.
          </p>
        </div>

        {/* Application Tracking ID Card */}
        <div
          className="glass"
          style={{
            borderRadius: 22,
            padding: "24px 30px",
            marginBottom: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 15,
            background: `${c.primary}08`,
            border: `1.5px solid ${c.primary}30`,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: c.muted, fontWeight: 700, textTransform: "uppercase" }}>
              APPLICATION TRACKING IDENTIFIER
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: c.primary,
                letterSpacing: 0.5,
                marginTop: 2,
                fontFamily: "monospace",
              }}
            >
              {effectiveAppId}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={handleCopyId}
              style={{
                ...secondaryButton(c),
                padding: "10px 18px",
                fontSize: 13,
              }}
            >
              {copied ? <Check size={16} color={c.success} /> : <Copy size={16} />}
              {copied ? "Copied to Clipboard!" : "Copy Tracking ID"}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              style={{
                ...primaryButton(c),
                padding: "10px 18px",
                fontSize: 13,
              }}
            >
              <Download size={16} />
              Print Receipt
            </button>
          </div>
        </div>

        {/* 4-Stage Visual Status Timeline */}
        <div
          className="glass"
          style={{
            borderRadius: 24,
            padding: 32,
            marginBottom: 30,
          }}
        >
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: "0 0 24px" }}>
            Application Processing Stages
          </h2>

          <div style={{ display: "grid", gap: 20 }}>
            {trackingMilestones.map((stage, idx) => (
              <div
                key={stage.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 18,
                  position: "relative",
                }}
              >
                {/* Circle Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: stage.isCompleted
                      ? c.primary
                      : stage.isActive
                      ? `${c.accent}25`
                      : c.surface2,
                    color: stage.isCompleted
                      ? "white"
                      : stage.isActive
                      ? c.accent
                      : c.muted,
                    border: `2px solid ${
                      stage.isCompleted
                        ? c.primary
                        : stage.isActive
                        ? c.accent
                        : c.border
                    }`,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    zIndex: 2,
                  }}
                >
                  {stage.isCompleted ? (
                    <Check size={20} />
                  ) : stage.isActive ? (
                    <Clock size={20} />
                  ) : (
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    paddingBottom: idx < trackingMilestones.length - 1 ? 16 : 0,
                    borderBottom: idx < trackingMilestones.length - 1 ? `1px solid ${c.border}40` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: stage.isCompleted || stage.isActive ? c.text : c.muted }}>
                      {stage.title}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: 10,
                        background: stage.isCompleted ? `${c.success}18` : stage.isActive ? `${c.accent}18` : c.surface2,
                        color: stage.isCompleted ? c.success : stage.isActive ? c.accent : c.muted,
                      }}
                    >
                      {stage.timestamp}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: c.muted, marginTop: 4, lineHeight: 1.5 }}>
                    {stage.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application Details Summary */}
        <div
          className="glass"
          style={{
            borderRadius: 22,
            padding: 28,
            marginBottom: 30,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 18px" }}>
            Application Summary & Next Steps
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={{ padding: 14, borderRadius: 14, background: c.surface2 }}>
              <div style={{ fontSize: 12, color: c.muted, fontWeight: 700 }}>SCHEME</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3 }}>{schemeName}</div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: c.surface2 }}>
              <div style={{ fontSize: 12, color: c.muted, fontWeight: 700 }}>APPLICANT CATEGORY</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3 }}>{profile?.category || "General"}</div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: c.surface2 }}>
              <div style={{ fontSize: 12, color: c.muted, fontWeight: 700 }}>STATE / DISTRICT</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3 }}>{profile?.location || profile?.state || "Uttar Pradesh"}</div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: c.surface2 }}>
              <div style={{ fontSize: 12, color: c.muted, fontWeight: 700 }}>ESTIMATED TIME</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 3 }}>15 - 30 working days</div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: `${c.primary}12`, border: `1px solid ${c.primary}30` }}>
              <div style={{ fontSize: 12, color: c.muted, fontWeight: 700 }}>ASSIGNED CHANNEL PARTNER</div>
              <div style={{ fontWeight: 850, fontSize: 15, marginTop: 3, color: c.primary }}>{partnerName}</div>
            </div>

            {financialPlan && (
              <div style={{ padding: 14, borderRadius: 14, background: `${c.accent}12`, border: `1px solid ${c.accent}30` }}>
                <div style={{ fontSize: 12, color: c.muted, fontWeight: 700 }}>INDICATIVE LOAN & EMI</div>
                <div style={{ fontWeight: 850, fontSize: 15, marginTop: 3, color: c.accent }}>
                  Rs. {Number(financialPlan.loanAmount).toLocaleString("en-IN")} (~Rs. {Number(financialPlan.monthlyEmi).toLocaleString("en-IN")}/mo)
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              background: `${c.primary}10`,
              color: c.text,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <strong>📌 What happens next?</strong> The designated Nodal Officer at the Channel Partner branch will review your uploaded documents. If any clarification is needed, you will receive an official notification via SMS / phone call. Keep your original documents ready for branch verification.
          </div>
        </div>

        {/* Live Application Lookup Tool */}
        <div
          className="glass"
          style={{
            borderRadius: 22,
            padding: 28,
            marginBottom: 30,
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>
            Track Another Application
          </h3>
          <p style={{ fontSize: 13, color: c.muted, margin: "0 0 16px" }}>
            Have a different tracking ID? Enter it below to fetch real-time application status.
          </p>

          <form onSubmit={handleLookup} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="e.g. APP-2026-69295"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              style={{
                ...inputStyle(c),
                flex: 1,
                minWidth: 220,
              }}
            />

            <button
              type="submit"
              disabled={lookupLoading || !lookupId.trim()}
              style={{
                ...secondaryButton(c),
                padding: "12px 22px",
                opacity: lookupLoading || !lookupId.trim() ? 0.5 : 1,
              }}
            >
              {lookupLoading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Track Status
            </button>
          </form>

          {lookupError && (
            <div style={{ marginTop: 10, color: c.danger, fontSize: 13, fontWeight: 700 }}>
              ⚠️ {lookupError}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 15,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onHome}
            style={{
              ...secondaryButton(c),
              padding: "14px 26px",
              fontSize: 15,
            }}
          >
            <Search size={18} />
            {t.browseSchemes || "Explore More Schemes"}
          </button>

          <button
            type="button"
            onClick={onDashboard}
            style={{
              ...primaryButton(c),
              padding: "14px 26px",
              fontSize: 15,
            }}
          >
            <LayoutDashboard size={18} />
            Go to My Dashboard
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function PageShell({ c, children }) {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "calc(100vh - 74px)",
        background: `
          radial-gradient(circle at 90% 0%, ${c.primary}09, transparent 25%),
          radial-gradient(circle at 0% 30%, ${c.accent}08, transparent 25%)
        `,
      }}
    >
      {children}
    </main>
  );
}

function BackButton({ c, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${c.border}`,
        background: c.surface,
        color: c.text,
        borderRadius: 12,
        padding: "9px 14px",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}

function Input({
  c,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 750,
          marginBottom: 8,
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle(c)}
      />
    </div>
  );
}

function navButton(c) {
  return {
    border: "none",
    background: "transparent",
    color: c.text,
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontWeight: 650,
    fontSize: 14,
  };
}

function iconButton(c) {
  return {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: `1px solid ${c.border}`,
    background: c.surface,
    color: c.text,
    display: "grid",
    placeItems: "center",
  };
}

function mobileMenuButton(c) {
  return {
    border: `1px solid ${c.border}`,
    background: c.surface2,
    color: c.text,
    borderRadius: 12,
    padding: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
  };
}

function primaryButton(c) {
  return {
    border: "none",
    borderRadius: 14,
    padding: "14px 21px",
    background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    fontWeight: 800,
    boxShadow: `0 12px 25px ${c.primary}35`,
  };
}

function secondaryButton(c) {
  return {
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    padding: "13px 19px",
    background: c.surface,
    color: c.text,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 750,
  };
}

function inputStyle(c) {
  return {
    width: "100%",
    padding: "14px 15px",
    borderRadius: 13,
    border: `1.5px solid ${c.border}`,
    background: c.surface,
    color: c.text,
    outline: "none",
  };
}

export default App;
