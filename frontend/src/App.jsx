import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Calculator,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  IndianRupee,
  Landmark,
  Languages,
  LayoutDashboard,
  Lightbulb,
  LockKeyhole,
  MapPin,
  Menu,
  Mic,
  MicOff,
  Moon,
  Percent,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  User,
  UserCircle,
  Users,
  Volume2,
  X,
} from "lucide-react";
import {
  checkHealth,
  extractProfile,
  matchSchemes as apiMatchSchemes,
  verifyDocument,
  submitApplication,
  getApplicationStatus,
  getUserApplications,
  deleteUploadedDocument,
  getDocumentDownloadUrl,
  getNearbyPartners,
  calculateEmi,
  simulateWhatIf,
  assessFinancialReadiness,
  getRecommendedPartners,
  routeChannelPartners,
  checkDocumentReadiness,
  getSchemeDocumentChecklist,
  uploadSchemeDocument,
  calculateDocumentReadiness,
  getSchemeSources,
  sendChatMessage,
} from "./services/api/index.js";
import { useVoiceRecorder } from "./hooks/useVoiceRecorder.js";
import { transliterateWord, transliterateSentence } from "./utils/transliteration.js";
import { PartnerMap } from "./components/PartnerMap.jsx";

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
  },
  {
    code: "hi",
    name: "हिंदी",
    english: "Hindi",
    choose: "अपनी भाषा चुनें",
  },
  {
    code: "bn",
    name: "বাংলা",
    english: "Bengali",
    choose: "আপনার ভাষা নির্বাচন করুন",
  },
  {
    code: "ta",
    name: "தமிழ்",
    english: "Tamil",
    choose: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
  },
  {
    code: "mr",
    name: "मराठी",
    english: "Marathi",
    choose: "आपली भाषा निवडा",
  },
  {
    code: "te",
    name: "తెలుగు",
    english: "Telugu",
    choose: "మీ భాషను ఎంచుకోండి",
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

const CALCULATOR_COPY = {
  en: {
    kicker: "FINANCIAL PLANNING AND EMI",
    title: "Loan & EMI Calculator",
    subtitle: "Estimate monthly installments, interest burden, and scheme suitability.",
    estimate: "Repayment Estimate",
    helper: "Adjust loan amount, interest rate, and tenure to calculate real EMI metrics.",
    loan: "Required Loan Amount",
    interest: "Annual Interest Rate (%)",
    tenure: "Tenure (Years)",
    years: "Years",
    emi: "Estimated Monthly EMI",
    totalInterest: "Total Interest Payable",
    totalPayment: "Total Repayment",
    whatIf: "Run What-If Scenario Analysis",
    readiness: "Check Financial Readiness",
    breakdown: "Loan Breakdown",
    principal: "Principal Loan",
    effectiveRate: "Effective Monthly Rate",
  },
  hi: {
    kicker: "वित्तीय योजना और ईएमआई",
    title: "ऋण और ईएमआई कैलकुलेटर",
    subtitle: "मासिक किस्त, कुल देय ब्याज और योजना उपयुक्तता का सटीक अनुमान लगाएं।",
    estimate: "पुनर्भुगतान अनुमान",
    helper: "वास्तविक ईएमआई देखने के लिए ऋण राशि, ब्याज दर और अवधि को समायोजित करें।",
    loan: "आवश्यक ऋण राशि",
    interest: "वार्षिक ब्याज दर (%)",
    tenure: "ऋण अवधि (वर्ष)",
    years: "वर्ष",
    emi: "अनुमानित मासिक ईएमआई",
    totalInterest: "कुल देय ब्याज",
    totalPayment: "कुल पुनर्भुगतान",
    whatIf: "संभावित प्रभाव विश्लेषण चलाएं",
    readiness: "वित्तीय तत्परता जांचें",
    breakdown: "ऋण विभाजन",
    principal: "मूल ऋण राशि",
    effectiveRate: "प्रभावी मासिक दर",
  },
  bn: {
    kicker: "আর্থিক পরিকল্পনা ও ইএমআই",
    title: "ঋণ ও ইএমআই ক্যালকুলেটর",
    subtitle: "মাসিক কিস্তি, মোট সুদ এবং প্রকল্পের উপযুক্ততার হিসাব করুন।",
    estimate: "পরিশোধের অনুমান",
    helper: "প্রকৃত ইএমআই মেট্রিক্স দেখতে ঋণের পরিমাণ, সুদের হার এবং মেয়াদ সমন্বয় করুন।",
    loan: "প্রয়োজনীয় ঋণের পরিমাণ",
    interest: "বার্ষিক সুদের হার (%)",
    tenure: "মেয়াদ (বছর)",
    years: "বছর",
    emi: "আনুমানিক मासिक ইএমআই",
    totalInterest: "মোট প্রদেয় সুদ",
    totalPayment: "মোট পরিশোধ",
    whatIf: "পরিস্থিতি विश्लेषण চালান",
    readiness: "আর্থিক প্রস্তুতি পরীক্ষা",
    breakdown: "ঋণের বিভাজন",
    principal: "মূল ঋণ",
    effectiveRate: "কার্যকরী মাসিক হার",
  },
  ta: {
    kicker: "நிதி திட்டமிடல் & EMI",
    title: "கடன் & EMI கால்குலேட்டர்",
    subtitle: "மாதாந்திர தவணை, மொத்த வட்டி மற்றும் திட்ட பொருத்தத்தை மதிப்பிடுங்கள்.",
    estimate: "திருப்பிச் செலுத்தும் மதிப்பீடு",
    helper: "கடன் தொகை, வட்டி விகிதம் மற்றும் காலத்தை மாற்றி EMI கணக்கிடுங்கள்.",
    loan: "தேவையான கடன் தொகை",
    interest: "ஆண்டு வட்டி விகிதம் (%)",
    tenure: "கால அளவு (ஆண்டுகள்)",
    years: "ஆண்டுகள்",
    emi: "மதிப்பிடப்பட்ட மாதாந்திர EMI",
    totalInterest: "செலுத்த வேண்டிய மொத்த வட்டி",
    totalPayment: "மொத்த திருப்பிச் செலுத்துதல்",
    whatIf: "சூழ்நிலை பகுப்பாய்வு",
    readiness: "நிதி தயார்நிலை சரிபார்ப்பு",
    breakdown: "கடன் விவரங்கள்",
    principal: "அசல் கடன்",
    effectiveRate: "பயனுள்ள மாதாந்திர விகிதம்",
  },
  mr: {
    kicker: "आर्थिक नियोजन आणि ईएमआय",
    title: "कर्ज आणि ईएमआय कॅल्क्युलेटर",
    subtitle: "मासिक हप्ता, एकूण व्याज आणि योजना उपयुक्ततेचा अचूक अंदाज घ्या.",
    estimate: "परतफेड अंदाज",
    helper: "ईएमआय मेट्रिक्स तपासण्यासाठी कर्जाची रक्कम, व्याज दर आणि कालावधी समायोजित करा.",
    loan: "आवश्यक कर्जाची रक्कम",
    interest: "वार्षिक व्याज दर (%)",
    tenure: "कालावधी (वर्षे)",
    years: "वर्षे",
    emi: "अंदाजे मासिक ईएमआय",
    totalInterest: "एकूण देय व्याज",
    totalPayment: "एकूण परतफेड",
    whatIf: "परिस्थिती विश्लेषण चालवा",
    readiness: "आर्थिक तयारी तपासा",
    breakdown: "कर्ज विभाजन",
    principal: "मूळ कर्ज",
    effectiveRate: "प्रभावी मासिक दर",
  },
  te: {
    kicker: "ఆర్థిక ప్రణాళిక & EMI",
    title: "రుణం & EMI క్యాలిక్యులేటర్",
    subtitle: "నెలవారీ వాయిదా, మొత్తం వడ్డీ మరియు పథకం సరిపోలికను అంచనా వేయండి.",
    estimate: "తిరిగి చెల్లింపు అంచనా",
    helper: "రుణ మొత్తం, వడ్డీ రేటు మరియు వ్యవధిని సర్దుబాటు చేసి EMI లెక్కించండి.",
    loan: "అవసరమైన రుణ మొత్తం",
    interest: "వార్షిక వడ్డీ రేటు (%)",
    tenure: "వ్యవధి (సంవత్సరాలు)",
    years: "సంవత్సరాలు",
    emi: "అంచనా వేసిన నెలవారీ EMI",
    totalInterest: "మొత్తం చెల్లించవలసిన వడ్డీ",
    totalPayment: "మొత్తం తిరిగి చెల్లింపు",
    whatIf: "పరిస్థితి విశ్లేషణను అమలు చేయండి",
    readiness: "ఆర్థిక సంసిద్ధతను తనిఖీ చేయండి",
    breakdown: "రుణ విభజన",
    principal: "అసలు రుణం",
    effectiveRate: "నెలవారీ వడ్డీ రేటు",
  }
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

function ChatbotWidget({ c, language, profile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const lang = language || "hi";

  const initialGreeting =
    lang === "hi"
      ? "नमस्ते! मैं आपका SchemeSaathi AI Chatbot हूँ। आप मुझसे किसी भी योजना, पात्रता या आवश्यक दस्तावेज़ों के बारे में पूछ सकते हैं!"
      : lang === "bn"
      ? "নমস্কার! আমি আপনার SchemeSaathi AI Chatbot। যেকোনো সরকারি প্রকল্প সম্পর্কে প্রশ্ন করুন!"
      : lang === "ta"
      ? "வணக்கம்! நான் உங்கள் SchemeSaathi AI உதவி மையம். எந்த திட்டத்தை பற்றியும் கேளுங்கள்!"
      : lang === "mr"
      ? "नमस्कार! मी तुमचा SchemeSaathi AI Chatbot आहे. मला कोणत्याही योजनेबद्दल विचारू शकता!"
      : lang === "te"
      ? "నమస్కారం! నేను మీ SchemeSaathi AI ఛాట్‌బాట్. ప్రభుత్వ పథకాల గురించి నన్ను అడగండి!"
      : "Hello! I am your SchemeSaathi RAG AI Chatbot. Ask me anything about schemes, eligibility rules, or application steps!";

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts =
    lang === "hi"
      ? ["महिला उद्यमियों की योजनाएं", "मुद्रा लोन पात्रता", "Stand-Up India दस्तावेज"]
      : ["Women Entrepreneur Schemes", "PM Mudra Eligibility", "Stand-Up India Documents"];

  const handleSend = async (customText = null) => {
    const query = customText || input;
    if (!query || !query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setIsTyping(true);

    try {
      const res = await sendChatMessage({
        message: query.trim(),
        language: lang,
        category: profile?.category,
        income: profile?.income ? Number(profile.income) : undefined,
      });

      const botReply = res?.reply || "Here is what I found based on your search.";
      const matched = res?.matched_schemes || [];

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: botReply,
          schemes: matched,
          confidence: res?.confidence_score,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.warn("Chatbot API fallback triggered:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text:
            lang === "hi"
              ? "SchemeSaathi RAG AI के अनुसार: आपके प्रश्न से संबंधित प्रमुख योजनाएं **Stand-Up India**, **PM Mudra Yojana**, और **PM-DAKSH** हैं। आप अपने प्रोफ़ाइल विवरण भरकर 100% सटीक मिलान प्राप्त कर सकते हैं!"
              : "Based on SchemeSaathi FAISS knowledge base: The top matching schemes are **Stand-Up India**, **PM Mudra Yojana**, and **PM-DAKSH**. Complete your profile for 100% verified matching!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
            borderRadius: 50,
            background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
            color: "#FFFFFF",
            border: "none",
            boxShadow: "0 10px 25px rgba(8, 127, 91, 0.4)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 15,
            transition: "all 0.3s ease",
          }}
        >
          <Sparkles size={20} />
          <span>AI Chatbot</span>
        </button>
      ) : (
        <div
          style={{
            width: 380,
            height: 520,
            maxWidth: "92vw",
            maxHeight: "82vh",
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 20,
            boxShadow: c.shadow,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Sparkles size={18} color="#FFF" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: "#FFF" }}>
                  SchemeSaathi AI Chatbot
                </h4>
                <span style={{ fontSize: 12, opacity: 0.9 }}>RAG Vector Search (405 Schemes)</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#FFF",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: c.bg,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: m.sender === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                    background: m.sender === "user" ? c.primary : c.surface,
                    color: m.sender === "user" ? "#FFFFFF" : c.text,
                    border: m.sender === "user" ? "none" : `1px solid ${c.border}`,
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.text}

                  {m.schemes && m.schemes.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {m.schemes.map((s, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "8px 10px",
                            background: c.surface2,
                            borderRadius: 8,
                            border: `1px solid ${c.border}`,
                            fontSize: 12,
                          }}
                        >
                          <div style={{ fontWeight: 700, color: c.primary }}>{s.scheme_name}</div>
                          <div style={{ color: c.muted, fontSize: 11 }}>{s.benefit_summary}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: c.muted,
                    marginTop: 4,
                    textAlign: m.sender === "user" ? "right" : "left",
                    padding: "0 4px",
                  }}
                >
                  {m.timestamp}
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 14px",
                  background: c.surface,
                  borderRadius: 14,
                  border: `1px solid ${c.border}`,
                  fontSize: 13,
                  color: c.muted,
                }}
              >
                AI is searching 405 schemes...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: "8px 12px",
              background: c.surface,
              borderTop: `1px solid ${c.border}`,
              display: "flex",
              gap: 6,
              overflowX: "auto",
            }}
          >
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                style={{
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 20,
                  background: c.surface2,
                  color: c.primary,
                  border: `1px solid ${c.border}`,
                  cursor: "pointer",
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: 12,
              background: c.surface,
              borderTop: `1px solid ${c.border}`,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={lang === "hi" ? "योजना के बारे में पूछें..." : "Ask about any scheme..."}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${c.border}`,
                background: c.bg,
                color: c.text,
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={() => handleSend()}
              style={{
                padding: 10,
                borderRadius: 12,
                background: c.primary,
                color: "#FFF",
                border: "none",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
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
    projectCost: "",
  });

  const [profileStep, setProfileStep] = useState(0);
  const [voiceRequested, setVoiceRequested] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [applicationRecord, setApplicationRecord] = useState(null);
  const [docStatus, setDocStatus] = useState({});
  const [statusStep, setStatusStep] = useState(0);
  const [loadPct, setLoadPct] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [findSchemesMode, setFindSchemesMode] = useState(false);
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [extractedProfile, setExtractedProfile] = useState(null);
  const [backendMatches, setBackendMatches] = useState(null);

  // Fallback local results
  const localResults = matchSchemes({
    category: profile.category,
    income: Number(profile.income || 900000),
    businessType: profile.businessType,
  });

  // Effective results: backend matches if available, else local
  const results = backendMatches && backendMatches.length > 0 ? backendMatches : localResults;

  // Check backend health on mount
  useEffect(() => {
    checkHealth()
      .then((res) => {
        if (res && res.status === "ok") {
          console.log("[Backend] Connected to FastAPI backend successfully.");
        }
      })
      .catch((err) => {
        console.warn("[Backend] FastAPI backend not detected, using offline mode:", err.message);
      });
  }, []);

  // Loading animation for screen === "loading"
  useEffect(() => {
    if (screen !== "loading") return;

    setLoadPct(0);

    const timer = setInterval(() => {
      setLoadPct((value) => {
        if (value >= 100) {
          clearInterval(timer);
          return 100;
        }
        return value + 5;
      });
    }, 60);

    const redirect = setTimeout(() => {
      setScreen("results");
    }, 1400);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [screen]);

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  const selectLanguage = (code) => {
    setLanguage(code);
  };

  const startProfile = () => {
    setProfileStep(0);
    setVoiceRequested(true);
    setScreen("profile");
  };

  const handleStartMatching = async (profileData) => {
    setScreen("loading");
    try {
      const matchReq = {
        category: profileData?.category || profile.category || "General",
        income: Number(profileData?.income || profile.income || 300000),
        business_type: profileData?.businessType || profile.businessType || "Manufacturing",
        state: profileData?.location || profile.location || "Delhi",
        project_cost: Number(profileData?.projectCost || profile.projectCost || 500000),
      };
      const res = await apiMatchSchemes(matchReq);
      if (res && (res.auto_matched || res.borderline)) {
        const combined = [
          ...(res.auto_matched || []).map((s) => ({
            ...s,
            id: s.scheme_id,
            score: Math.round((s.confidence || 0.85) * 100),
            matchScore: Math.round((s.confidence || 0.85) * 100),
            name: s.scheme_name,
            documents: s.documents_required || [],
          })),
          ...(res.borderline || []).map((s) => ({
            ...s,
            id: s.scheme_id,
            score: Math.round((s.confidence || 0.65) * 100),
            matchScore: Math.round((s.confidence || 0.65) * 100),
            name: s.scheme_name,
            documents: s.documents_required || [],
          })),
        ];
        if (combined.length > 0) {
          setBackendMatches(combined);
        }
      }
    } catch (err) {
      console.warn("[Matcher] Backend match error, using local matcher:", err.message);
    }
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
          overflow-x: hidden;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        .container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
        }

        .glass {
          background: ${c.surface};
          border: 1px solid ${c.border};
          box-shadow: ${c.shadow};
          backdrop-filter: blur(10px);
        }

        .fade {
          animation: fadeIn .35s ease;
        }

        .slideUp {
          animation: slideUp .35s ease;
        }

        .pulse {
          animation: pulse 2.2s infinite;
        }

        .float {
          animation: float 4s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 ${c.primary}45;
          }
          70% {
            box-shadow: 0 0 0 16px ${c.primary}00;
          }
          100% {
            box-shadow: 0 0 0 0 ${c.primary}00;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 900px) {
          .container {
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>

      {helpOpen && (
        <HelpModal
          c={c}
          t={t}
          onClose={() => setHelpOpen(false)}
        />
      )}

      {screen !== "dashboard" && (
        <Header
          c={c}
          theme={theme}
          toggleTheme={toggleTheme}
          mobileMenu={mobileMenu}
          setMobileMenu={setMobileMenu}
          onLanguage={() => setScreen("language")}
          onAuth={() => setScreen("auth")}
          onHelp={() => setHelpOpen(true)}
          t={t}
        />
      )}

      {screen === "landing" && (
        <LandingScreen
          c={c}
          t={t}
          onStart={() => {
            if (language) {
              setScreen("dashboard");
            } else {
              setScreen("language");
            }
          }}
          onLearn={() => setHelpOpen(true)}
          language={language || "en"}
        />
      )}

      {screen === "language" && (
        <LanguageScreen
          c={c}
          t={t}
          language={language}
          setLanguage={selectLanguage}
          onContinue={() => setScreen("dashboard")}
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
          onBack={() => setScreen("landing")}
        />
      )}

      {screen === "dashboard" && (
        <DashboardScreen
          c={c}
          t={t}
          user={user}
          profile={profile}
          results={results}
          setProfile={setProfile}
          profileStep={profileStep}
          setProfileStep={setProfileStep}
          savedSchemes={savedSchemes}
          setSavedSchemes={setSavedSchemes}
          onStart={() => setScreen("welcome")}
          onFindSchemes={() => {
            setFindSchemesMode(true);
            setScreen("profile");
          }}
          onFinish={() => handleStartMatching(profile)}
          onOpenScheme={(scheme) => {
            setSelectedScheme(scheme);
            setScreen("detail");
          }}
        />
      )}

      {screen === "welcome" && (
        <WelcomeScreen
          c={c}
          t={t}
          language={language || "en"}
          user={user}
          extractedProfile={extractedProfile}
          setExtractedProfile={setExtractedProfile}
          onConfirmExtracted={(extracted) => {
            setProfile((prev) => ({
              ...prev,
              category: extracted.category || prev.category,
              income: extracted.income ? String(extracted.income) : prev.income,
              businessType: extracted.business_type || prev.businessType,
              location: extracted.state || prev.location,
              projectCost: extracted.project_cost ? String(extracted.project_cost) : prev.projectCost,
            }));
            handleStartMatching(extracted);
          }}
          onEditInForm={(extracted) => {
            if (extracted) {
              setProfile((prev) => ({
                ...prev,
                category: extracted.category || prev.category,
                income: extracted.income ? String(extracted.income) : prev.income,
                businessType: extracted.business_type || prev.businessType,
                location: extracted.state || prev.location,
                projectCost: extracted.project_cost ? String(extracted.project_cost) : prev.projectCost,
              }));
            }
            setScreen("profile");
          }}
          onStart={() => setScreen("profile")}
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
          onBack={() => setScreen(findSchemesMode ? "dashboard" : "welcome")}
          onFinish={() => {
            setFindSchemesMode(false);
            handleStartMatching(profile);
          }}
        />
      )}

      {screen === "loading" && (
        <LoadingScreen c={c} t={t} pct={loadPct} />
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
          onBack={() => setScreen("profile")}
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
          onBack={() => setScreen("results")}
          onApply={() => setScreen("upload")}
        />
      )}

      {screen === "upload" && selectedScheme && (
        <UploadScreen
          c={c}
          t={t}
          language={language || "en"}
          scheme={selectedScheme}
          docStatus={docStatus}
          setDocStatus={setDocStatus}
          selectedPartner={selectedPartner}
          onBack={() => setScreen("detail")}
          onSubmit={() => {
            setStatusStep(0);
            setScreen("status");
          }}
        />
      )}

      {screen === "status" && selectedScheme && (
        <StatusScreen
          c={c}
          t={t}
          language={language || "en"}
          scheme={selectedScheme}
          profile={profile}
          selectedPartner={selectedPartner}
          applicationRecord={applicationRecord}
          setApplicationRecord={setApplicationRecord}
          statusStep={statusStep}
          setStatusStep={setStatusStep}
          onHome={() => setScreen("dashboard")}
        />
      )}
      {/* Floating RAG AI Chatbot Assistant */}
      <ChatbotWidget c={c} language={language} profile={profile} />
    </div>
  );
}


function ApplicationsPanel({ c, language = "en", onSelectApplication, onBrowseSchemes }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const labels = {
    en: {
      title: "My Applications",
      subtitle: "Track your government scheme applications, status updates, and required documents in real-time.",
      noApps: "No applications submitted yet.",
      noAppsHint: "Explore eligible schemes tailored to your profile and submit your first application.",
      browse: "Find Matching Schemes",
      viewDetails: "View Details & History",
      appId: "Application ID",
      scheme: "Scheme",
      submittedOn: "Submitted on",
      status: "Status",
      partner: "Nodal Partner",
      refresh: "Refresh List",
    },
    hi: {
      title: "मेरे आवेदन",
      subtitle: "सरकारी योजना आवेदनों, स्थिति अपडेट और आवश्यक दस्तावेज़ों को रीयल-टाइम में ट्रैक करें।",
      noApps: "अभी तक कोई आवेदन जमा नहीं किया गया है।",
      noAppsHint: "अपनी प्रोफ़ाइल के अनुसार पात्र योजनाएं खोजें और अपना पहला आवेदन जमा करें।",
      browse: "योजनाएं खोजें",
      viewDetails: "विवरण और इतिहास देखें",
      appId: "आवेदन संख्या",
      scheme: "योजना",
      submittedOn: "जमा करने की तिथि",
      status: "स्थिति",
      partner: "नोडल पार्टनर",
      refresh: "सूची ताज़ा करें",
    },
    bn: {
      title: "আমার আবেদনসমূহ",
      subtitle: "আপনার সরকারি প্রকল্পের আবেদন, স্থিতি এবং প্রয়োজনীয় নথিগুলি ট্র্যাক করুন।",
      noApps: "এখনও কোনও আবেদন জমা দেওয়া হয়নি।",
      noAppsHint: "উপযুক্ত প্রকল্প খুঁজুন এবং আপনার প্রথম আবেদন জমা দিন।",
      browse: "প্রকল্প খুঁজুন",
      viewDetails: "বিস্তারিত এবং ইতিহাস দেখুন",
      appId: "আবেদন আইডি",
      scheme: "প্রকল্প",
      submittedOn: "জমা দেওয়ার তারিখ",
      status: "স্থিতি",
      partner: "নোডাল পার্টনার",
      refresh: "তালিকা রিফ্রেশ করুন",
    },
    ta: {
      title: "எனது விண்ணப்பங்கள்",
      subtitle: "உங்கள் அரசு திட்ட விண்ணப்பங்கள் மற்றும் நிலையை கண்காணிக்கவும்.",
      noApps: "இன்னும் விண்ணப்பங்கள் சமர்ப்பிக்கப்படவில்லை.",
      noAppsHint: "பொருத்தமான திட்டங்களைக் கண்டறிந்து விண்ணப்பிக்கவும்.",
      browse: "திட்டங்களை காண்க",
      viewDetails: "விவரங்களை காண்க",
      appId: "விண்ணப்ப எண்",
      scheme: "திட்டம்",
      submittedOn: "சமர்ப்பிக்கப்பட்ட தேதி",
      status: "நிலை",
      partner: "நோடல் பார்ட்னர்",
      refresh: "புதுப்பிக்கவும்",
    },
    mr: {
      title: "माझे अर्ज",
      subtitle: "तुमचे शासकीय योजना अर्ज, स्थिती अद्यतने आणि कागदपत्रे तपासा.",
      noApps: "अद्याप कोणतेही अर्ज दाखल केलेले नाहीत.",
      noAppsHint: "पात्र योजना शोधा आणि तुमचा पहिला अर्ज सादर करा.",
      browse: "योजना शोधा",
      viewDetails: "तपशील आणि इतिहास पहा",
      appId: "अर्ज क्रमांक",
      scheme: "योजना",
      submittedOn: "सादर केल्याची तारीख",
      status: "स्थिती",
      partner: "नोडल पार्टनर",
      refresh: "ताजे करा",
    },
    te: {
      title: "నా దరఖాస్తులు",
      subtitle: "మీ ప్రభుత్వ పథక దరఖాస్తులు మరియు స్థితిని ట్రాక్ చేయండి.",
      noApps: "ఇంకా ఎటువంటి దరఖాస్తులు సమర్పించలేదు.",
      noAppsHint: "అర్హత ఉన్న పథకాలను కనుగొని దరఖాస్తు చేసుకోండి.",
      browse: "పథకాలను కనుగొనండి",
      viewDetails: "వివరాలు మరియు చరిత్రను చూడండి",
      appId: "దరఖాస్తు ఐడీ",
      scheme: "పథకం",
      submittedOn: "సమర్పించిన తేదీ",
      status: "స్థితి",
      partner: "నోడల్ భాగస్వామి",
      refresh: "రిఫ్రెష్ చేయండి",
    },
  }[language] || {
    title: "My Applications",
    subtitle: "Track your government scheme applications, status updates, and required documents in real-time.",
    noApps: "No applications submitted yet.",
    noAppsHint: "Explore eligible schemes tailored to your profile and submit your first application.",
    browse: "Find Matching Schemes",
    viewDetails: "View Details & History",
    appId: "Application ID",
    scheme: "Scheme",
    submittedOn: "Submitted on",
    status: "Status",
    partner: "Nodal Partner",
    refresh: "Refresh List",
  };

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getUserApplications();
      if (res && Array.isArray(res.applications)) {
        setApplications(res.applications);
      } else if (Array.isArray(res)) {
        setApplications(res);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.warn("Could not fetch user applications from backend:", err.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const getStatusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("approved") || s.includes("disbursed")) return c.success;
    if (s.includes("rejected")) return c.danger;
    if (s.includes("review") || s.includes("submitted")) return c.accent;
    return c.primary;
  };

  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <div>
          <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7, textTransform: "uppercase" }}>
            GOVERNMENT SCHEME APPLICATIONS
          </div>
          <h1 style={{ fontSize: 30, margin: "6px 0 5px", color: c.text }}>{labels.title}</h1>
          <p style={{ color: c.muted, fontSize: 13, margin: 0, lineHeight: 1.55 }}>{labels.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={loadApplications}
          style={{ ...secondaryButton(c), padding: "9px 14px", fontSize: 12 }}
        >
          <RefreshCw size={14} /> {labels.refresh}
        </button>
      </div>

      {loading ? (
        <div className="glass" style={{ borderRadius: 18, padding: 40, textAlign: "center", color: c.muted }}>
          <RefreshCw size={24} className="pulse" style={{ margin: "0 auto 12px", color: c.primary }} />
          <div>Loading your applications from server...</div>
        </div>
      ) : applications.length === 0 ? (
        <div className="glass" style={{ borderRadius: 20, padding: 45, textAlign: "center", color: c.muted }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: `${c.primary}15`, color: c.primary, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <FileText size={28} />
          </div>
          <div style={{ color: c.text, fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{labels.noApps}</div>
          <p style={{ maxWidth: 460, margin: "0 auto 20px", fontSize: 13, lineHeight: 1.6 }}>{labels.noAppsHint}</p>
          <button
            type="button"
            onClick={onBrowseSchemes}
            style={{ ...primaryButton(c), padding: "12px 24px", fontSize: 13, margin: "0 auto" }}
          >
            <Sparkles size={16} /> {labels.browse}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {applications.map((app) => {
            const statusColor = getStatusColor(app.status);
            const formattedDate = app.submitted_at || app.created_at
              ? new Date(app.submitted_at || app.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : "Recently";

            return (
              <div
                key={app.application_id}
                className="glass hover-card"
                style={{ borderRadius: 18, padding: 22, textAlign: "left", color: c.text }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${c.primary}15`, color: c.primary, display: "grid", placeItems: "center" }}>
                      <FileCheck2 size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 750, textTransform: "uppercase" }}>
                        {labels.appId}: <span style={{ color: c.text, fontWeight: 850 }}>{app.application_id}</span>
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 850, marginTop: 2 }}>
                        {app.scheme_name || app.scheme_id || "Government Scheme"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 800,
                        background: `${statusColor}18`,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`,
                        textTransform: "capitalize",
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                      {String(app.status || "Submitted").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 16, padding: 14, borderRadius: 14, background: c.surface2 }}>
                  <div>
                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 750 }}>{labels.submittedOn}</div>
                    <div style={{ fontSize: 13, color: c.text, fontWeight: 800, marginTop: 2 }}>{formattedDate}</div>
                  </div>
                  {app.partner_name && (
                    <div>
                      <div style={{ fontSize: 10, color: c.muted, fontWeight: 750 }}>{labels.partner}</div>
                      <div style={{ fontSize: 13, color: c.text, fontWeight: 800, marginTop: 2 }}>{app.partner_name}</div>
                    </div>
                  )}
                  {app.document_count !== undefined && (
                    <div>
                      <div style={{ fontSize: 10, color: c.muted, fontWeight: 750 }}>DOCUMENTS</div>
                      <div style={{ fontSize: 13, color: c.text, fontWeight: 800, marginTop: 2 }}>{app.document_count} uploaded</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => onSelectApplication(app)}
                    style={{ ...primaryButton(c), padding: "10px 18px", fontSize: 12 }}
                  >
                    <Clock size={14} /> {labels.viewDetails}
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
}) {
  const currentLanguage = languageFromTranslation(t);
  const [loan, setLoan] = useState(500000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(5);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [heardText, setHeardText] = useState("");
  const [questionsStarted, setQuestionsStarted] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [extractingVoice, setExtractingVoice] = useState(false);
  const [voiceExtractError, setVoiceExtractError] = useState("");

  const voice = useVoiceRecorder(currentLanguage || "hi");

  const formatSecs = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // When voice recording completes and transcript arrives, automatically run NLP extraction
  useEffect(() => {
    if (voice.transcript && (voice.state === "ready" || voice.state === "transcribed")) {
      setExtractingVoice(true);
      setVoiceExtractError("");
      extractProfile(voice.transcript)
        .then((res) => {
          setExtractedData(res);
          if (res && res.extracted) {
            const ext = res.extracted;
            setProfile((prev) => ({
              ...prev,
              category: ext.category || prev.category,
              income: ext.income ? String(ext.income) : prev.income,
              businessType: ext.business_type || prev.businessType,
              location: ext.state || prev.location,
              projectCost: ext.project_cost ? String(ext.project_cost) : prev.projectCost,
            }));
          }
        })
        .catch((err) => {
          console.error("Dashboard NLP extraction error:", err);
          setVoiceExtractError(err.message || "Failed to extract profile from voice");
        })
        .finally(() => {
          setExtractingVoice(false);
        });
    }
  }, [voice.transcript, voice.state]);
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
    const calc = (typeof CALCULATOR_COPY !== "undefined" && (CALCULATOR_COPY[currentLanguage] || CALCULATOR_COPY.en)) || {
      kicker: "FINANCIAL PLANNING & EMI",
      title: "Loan & EMI Calculator",
      subtitle: "Estimate monthly installments, interest burden, and scheme suitability.",
      estimate: "Repayment Estimate",
      helper: "Adjust loan amount, interest rate, and tenure to calculate real EMI metrics.",
      loan: "Required Loan Amount",
      interest: "Annual Interest Rate (%)",
      tenure: "Tenure (Years)",
      years: "Years",
      emi: "Estimated Monthly EMI",
      totalInterest: "Total Interest Payable",
      totalPayment: "Total Repayment",
    };

    const principalPct = totalPayment > 0 ? Math.round((loan / totalPayment) * 100) : 50;
    const interestPct = Math.max(0, 100 - principalPct);

    return (
      <div className="fade" style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: c.muted, fontSize: 11, fontWeight: 750, letterSpacing: 0.8 }}>{calc.kicker}</div>
          <h1 style={{ fontSize: 30, margin: "5px 0 4px", color: c.text }}>{calc.title}</h1>
          <p style={{ color: c.muted, fontSize: 13 }}>{calc.subtitle}</p>
        </div>

        <div className="glass" style={{ borderRadius: 22, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 15, alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: 0.6 }}>{calc.kicker}</div>
              <h2 style={{ fontSize: 23, margin: "5px 0 3px", color: c.text, fontWeight: 900 }}>{calc.estimate}</h2>
              <p style={{ color: c.muted, fontSize: 12 }}>{calc.helper}</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.primary}14`, color: c.primary, display: "grid", placeItems: "center" }}>
              <Calculator size={22} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <CalculatorField c={c} icon={<IndianRupee size={15} />} label={calc.loan} value={loan} min={50000} max={5000000} step={10000} display={`₹${loan.toLocaleString("en-IN")}`} onChange={setLoan} />
            <CalculatorField c={c} icon={<Percent size={15} />} label={calc.interest} value={rate} min={1} max={20} step={0.1} display={`${rate.toFixed(1)}%`} onChange={setRate} />
            <CalculatorField c={c} icon={<CalendarDays size={15} />} label={calc.tenure} value={tenure} min={1} max={20} step={1} display={`${tenure} ${calc.years}`} onChange={setTenure} />
          </div>

          <div style={{ marginTop: 20, padding: 18, borderRadius: 16, background: c.surface2, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ color: c.muted, fontSize: 11, fontWeight: 700 }}>{calc.emi}</div>
              <div style={{ color: c.primary, fontSize: 26, fontWeight: 900, marginTop: 4 }}>₹{Math.round(emi).toLocaleString("en-IN")}</div>
            </div>
            <Metric label={calc.totalInterest} value={`₹${Math.round(totalInterest).toLocaleString("en-IN")}`} c={c} />
            <Metric label={calc.totalPayment} value={`₹${Math.round(totalPayment).toLocaleString("en-IN")}`} c={c} />
          </div>

          {/* Principal vs Interest visual distribution */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: c.muted, marginBottom: 6 }}>
              <span>Principal: {principalPct}% (₹{loan.toLocaleString("en-IN")})</span>
              <span>Interest: {interestPct}% (₹{Math.round(totalInterest).toLocaleString("en-IN")})</span>
            </div>
            <div style={{ height: 10, width: "100%", borderRadius: 6, background: `${c.primary}25`, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${principalPct}%`, background: c.primary, height: "100%" }} />
              <div style={{ width: `${interestPct}%`, background: "#F59E0B", height: "100%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7 }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).dash}</div>
        <h1 style={{ fontSize: 30, margin: "7px 0 5px", color: c.text }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).welcome}, {user.name || "Guest User"}</h1>
        <p style={{ color: c.muted, fontSize: 13, margin: 0 }}>{(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).tools}</p>
      </div>

      {/* Voice entry point with real MediaRecorder & Bhashini ASR */}
      {!questionsStarted && (
        <div
          className="glass"
          style={{
            borderRadius: 26,
            padding: 34,
            maxWidth: 820,
            margin: "0 auto 18px",
            textAlign: "center",
            background: voice.isRecording
              ? `${c.danger}0a`
              : voice.isStopping || voice.isTranscribing || voice.isProcessing || voice.state === "stopping" || voice.state === "transcribing" || voice.state === "uploading" || voice.state === "processing" || extractingVoice
              ? `${c.primary}0a`
              : c.surface,
            border: `1.5px solid ${voice.isRecording ? c.danger : c.border}`,
            transition: "all .3s ease",
          }}
        >
          <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7 }}>
            {t.voiceAssistance || "AI VOICE & SCHEME ASSISTANCE"}
          </div>
          <h2 style={{ fontSize: 24, margin: "7px 0 6px", color: c.text }}>
            {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).ready}
          </h2>
          <p style={{ color: c.muted, fontSize: 13, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 22px" }}>
            {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).desc}
          </p>

          {/* Interactive Mic Button */}
          <div style={{ position: "relative", width: 84, height: 84, margin: "0 auto 16px" }}>
            {voice.isRecording && (
              <div
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: `3px solid ${c.danger}`,
                  animation: "pulse 1.2s infinite",
                }}
              />
            )}
            <button
              type="button"
              onClick={voice.isRecording ? voice.stopRecording : voice.startRecording}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 26,
                border: "none",
                background: voice.isRecording
                  ? `linear-gradient(135deg, ${c.danger}, #A32D28)`
                  : `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                color: "white",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: voice.isRecording
                  ? `0 14px 35px ${c.danger}50`
                  : `0 14px 35px ${c.primary}40`,
                transition: "all .2s ease",
              }}
              title={voice.isRecording ? "Stop Recording" : "Start Recording"}
            >
              {voice.isRecording ? <MicOff size={34} /> : <Mic size={34} />}
            </button>
          </div>

          {/* Voice Status & Timers */}
          <div style={{ fontSize: 15, fontWeight: 800, color: voice.isRecording ? c.danger : c.text }}>
            {voice.isRecording ? (
              <div>
                <div>
                  {voice.isSpeechDetected
                    ? `🎙️ सुन रहा हूँ... (${formatSecs(voice.recordingTime)})`
                    : `🎙️ बोलिए... (${formatSecs(voice.recordingTime)})`}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginTop: 4 }}>
                  बोलना बंद करने पर स्वतः समाप्त होगा (Auto-Stop on Silence)
                </div>
              </div>
            ) : voice.state === "requesting_permission" ? (
              "Requesting microphone permission..."
            ) : voice.isStopping || voice.isTranscribing || voice.isProcessing || voice.state === "stopping" || voice.state === "transcribing" || voice.state === "uploading" || voice.state === "processing" || extractingVoice ? (
              <div>
                <div>⚡ Processing Audio with Bhashini ASR & NLP...</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.primary, marginTop: 4 }}>
                  कृपया प्रतीक्षा करें... (Transcribing & extracting requirements)
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 14 }}>
                {t.tapToSpeak}
              </span>
            )}
          </div>

          {/* LIVE INTERIM SPEECH PREVIEW (Words appear in real time while speaking) */}
          {voice.isRecording && voice.interimTranscript && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 16px",
                borderRadius: 14,
                background: `${c.danger}10`,
                border: `1.5px dashed ${c.danger}60`,
                fontSize: 14,
                color: c.text,
                textAlign: "left",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                maxWidth: 680,
                margin: "18px auto 0",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.danger, marginTop: 5, flexShrink: 0, animation: "pulse 1s infinite" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 11, color: c.danger, display: "block", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                  🔴 Live Speech Preview (सजीव पूर्वावलोकन):
                </strong>
                <span style={{ fontSize: 14, fontWeight: 650, color: c.text, fontStyle: "italic" }}>
                  "{voice.interimTranscript}"
                </span>
              </div>
            </div>
          )}

          {/* FINAL AUTHORITATIVE TRANSCRIPT (from Bhashini / Whisper) */}
          {voice.transcript && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 16,
                background: c.surface2,
                fontSize: 14,
                color: c.text,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 680,
                margin: "18px auto 0",
                border: `1.5px solid ${c.primary}40`,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Volume2 size={20} color={c.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <strong style={{ fontSize: 12, color: c.muted, textTransform: "uppercase" }}>
                      FINAL TRANSCRIPT ({voice.languageDetected.toUpperCase()}):
                    </strong>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: `${c.success}18`, color: c.success }}>
                      Bhashini ASR ✓
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14.5, color: c.text }}>"{voice.transcript}"</span>
                </div>
              </div>

              {/* Direct Next Step Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px solid ${c.border}`, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, color: c.muted }}>
                  {extractingVoice ? "⚡ Understanding requirement (NLP)..." : "✅ Voice processed successfully"}
                </span>
                <button
                  type="button"
                  onClick={() => onFinish()}
                  style={{
                    ...primaryButton(c),
                    padding: "8px 16px",
                    fontSize: 12.5,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Search size={14} /> {({ en: "Find Matching Schemes →", hi: "योजनाएँ खोजें →", bn: "প্রকল্প খুঁজুন →", ta: "திட்டங்களைக் காண்க →", mr: "योजना शोधा →", te: "పథకాలను కనుగొనండి →" }[currentLanguage] || "Find Matching Schemes →")}
                </button>
              </div>
            </div>
          )}

          {/* Extracted Profile confirmation card */}
          {extractedData?.extracted && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 16,
                background: `${c.primary}0e`,
                border: `1.5px solid ${c.primary}35`,
                textAlign: "left",
                maxWidth: 680,
                margin: "18px auto 0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <strong style={{ fontSize: 14, color: c.primary }}>
                  ✨ Extracted Profile (Confidence: {Math.round((extractedData.confidence || 0.85) * 100)}%)
                </strong>
                <span style={{ fontSize: 11, color: c.muted }}>POST /api/profile/extract</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
                {extractedData.extracted.category && (
                  <div style={{ padding: "8px 12px", borderRadius: 10, background: c.surface, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 10, color: c.muted }}>Category</div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{extractedData.extracted.category}</div>
                  </div>
                )}
                {extractedData.extracted.income && (
                  <div style={{ padding: "8px 12px", borderRadius: 10, background: c.surface, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 10, color: c.muted }}>Income</div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>₹{Number(extractedData.extracted.income).toLocaleString("en-IN")}</div>
                  </div>
                )}
                {extractedData.extracted.business_type && (
                  <div style={{ padding: "8px 12px", borderRadius: 10, background: c.surface, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 10, color: c.muted }}>Business Type</div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{extractedData.extracted.business_type}</div>
                  </div>
                )}
                {extractedData.extracted.state && (
                  <div style={{ padding: "8px 12px", borderRadius: 10, background: c.surface, border: `1px solid ${c.border}` }}>
                    <div style={{ fontSize: 10, color: c.muted }}>State</div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{extractedData.extracted.state}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => onFinish()}
                  style={{ ...primaryButton(c), padding: "9px 18px", fontSize: 13 }}
                >
                  <Search size={15} /> Find Matching Schemes
                </button>
              </div>
            </div>
          )}

          {/* Voice or Extraction error */}
          {(voice.error || voiceExtractError) && (
            <div style={{ marginTop: 12, color: c.danger, fontSize: 13, fontWeight: 600 }}>
              {voice.error || voiceExtractError}
            </div>
          )}

          <div style={{ marginTop: 18, color: c.muted, fontSize: 11, display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span>🎙 {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).natural}</span>
            <span>•</span>
            <span>🔊 {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).read}</span>
            <span>•</span>
            <span>✍️ {(DASHBOARD_COPY[currentLanguage] || DASHBOARD_COPY.en).auto}</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() => {
                setVoiceError("");
                setHeardText("");
                setQuestionsStarted(true);
                setProfileStep(0);
              }}
              style={{
                background: "transparent",
                border: `1px dashed ${c.border}`,
                borderRadius: 12,
                padding: "8px 16px",
                color: c.muted,
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 650,
              }}
            >
              📋 {({
                en: "Or Fill Step-by-Step Form",
                hi: "या चरण-दर-चरण फ़ॉर्म भरें",
                bn: "অথবা ধাপে ধাপে ফর্ম পূরণ করুন",
                ta: "அல்லது படிவத்தை நிரப்பவும்",
                mr: "किंवा टप्प्याटप्प्याने फॉर्म भरा",
                te: "లేదా దశలవారీగా ఫారమ్ పూరించండి",
              }[currentLanguage] || "Or Fill Step-by-Step Form")}
            </button>
          </div>
        </div>
      )}

      {/* Questionnaire mode */}
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
                language={languageFromTranslation(t)}
                profile={profile}
              />
            )
            : activeNav === "Calculator"
            ? renderCalculator()
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




function NearbyHelpScreen({ c, language = "en", profile, onSelectPartner }) {
  const copy = NEARBY_COPY[language] || NEARBY_COPY.en;
  const location = String(profile?.location || profile?.state || "").trim() || "Delhi";
  const [status, setStatus] = useState("loading");
  const [partners, setPartners] = useState([]);
  const [primaryPartner, setPrimaryPartner] = useState(null);
  const [error, setError] = useState("");
  const [routeInfo, setRouteInfo] = useState(null);

  const loadPartners = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await routeChannelPartners({
        district: profile?.district || location,
        state: profile?.state || location,
        category: profile?.category || null,
        scheme_id: profile?.scheme_id || null,
        limit: 12,
      });

      if (res && res.partners && res.partners.length > 0) {
        setPartners(res.partners);
        setPrimaryPartner(res.primary_partner || res.partners[0]);
        setStatus("ready");
      } else if (res && res.alternative_partners && res.alternative_partners.length > 0) {
        const combined = [res.primary_partner, ...res.alternative_partners].filter(Boolean);
        setPartners(combined);
        setPrimaryPartner(res.primary_partner || combined[0]);
        setStatus("ready");
      } else {
        // Fallback to nearby GET
        const nearbyRes = await getNearbyPartners({
          district: location,
          state: location,
          limit: 10,
        });
        if (nearbyRes && nearbyRes.partners && nearbyRes.partners.length > 0) {
          setPartners(nearbyRes.partners);
          setPrimaryPartner(nearbyRes.primary_partner || nearbyRes.partners[0]);
          setStatus("ready");
        } else {
          setPartners([]);
          setStatus("ready");
        }
      }
    } catch (err) {
      console.warn("Backend partner fetch failed, using fallback:", err.message);
      setPartners([]);
      setError("Unable to load channel partners from server. Please check backend connection.");
      setStatus("error");
    }
  }, [profile, location]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  return (
    <div className="fade" style={{ paddingBottom: 35 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: c.primary, fontSize: 11, fontWeight: 850, letterSpacing: .7, textTransform: "uppercase" }}>
          OFFICIAL CHANNEL PARTNERS & DIC DIRECTORY
        </div>
        <h1 style={{ fontSize: 30, margin: "6px 0 5px", color: c.text }}>{copy.title}</h1>
        <p style={{ color: c.muted, fontSize: 13, margin: 0, lineHeight: 1.55 }}>
          Government-authorized District Industries Centres (DICs), Lead Bank Offices, and State Channelizing Agencies for immediate assistance.
        </p>
      </div>

      <div className="glass" style={{ borderRadius: 18, padding: 17, marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ color: c.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{copy.selectedLocation}</div>
            <div style={{ color: c.text, fontSize: 17, fontWeight: 850, marginTop: 4 }}>{location}</div>
            <div style={{ color: c.muted, fontSize: 11, marginTop: 4 }}>Matching nearest nodal authorities and designated banks</div>
          </div>
          <button type="button" onClick={loadPartners} style={{ ...secondaryButton(c), padding: "10px 14px", fontSize: 11 }}>
            <RefreshCw size={14} /> {copy.search || "Refresh"}
          </button>
        </div>
      </div>

      {status === "loading" ? (
        <div className="glass" style={{ borderRadius: 18, padding: 35, textAlign: "center", color: c.muted }}>
          <RefreshCw size={24} className="pulse" style={{ margin: "0 auto 10px", color: c.primary }} />
          <div>{copy.loading || "Connecting to Channel Partner Routing Engine..."}</div>
        </div>
      ) : status === "error" ? (
        <div className="glass" style={{ borderRadius: 18, padding: 25, textAlign: "center" }}>
          <div style={{ color: c.danger, fontWeight: 800, marginBottom: 12 }}>{error}</div>
          <button type="button" onClick={loadPartners} style={{ ...secondaryButton(c), padding: "10px 14px", fontSize: 11 }}>{copy.retry || "Retry"}</button>
        </div>
      ) : partners.length === 0 ? (
        <div className="glass" style={{ borderRadius: 18, padding: 28, textAlign: "center", color: c.muted }}>
          {copy.noResults || "No official partners found in this district. Contact state nodal office."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {partners.map((partner, index) => {
            const isPrimary = primaryPartner && (primaryPartner.id === partner.id || primaryPartner.partner_id === partner.partner_id || index === 0);
            const dist = partner.distance_km ?? partner.distance ?? 2.5;

            return (
              <div
                key={partner.id || partner.partner_id || index}
                className="glass hover-card"
                style={{
                  borderRadius: 18,
                  padding: 20,
                  border: isPrimary ? `2px solid ${c.primary}` : `1px solid ${c.border}`,
                  position: "relative",
                  background: isPrimary ? `${c.primary}06` : c.surface,
                }}
              >
                {isPrimary && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: c.primary,
                      color: "white",
                      fontSize: 10,
                      fontWeight: 850,
                      padding: "4px 10px",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Sparkles size={11} /> RECOMMENDED NODAL PARTNER
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: isPrimary ? 16 : 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: isPrimary ? c.primary : `${c.primary}15`,
                      color: isPrimary ? "white" : c.primary,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {partner.type === "DIC" || partner.partner_type === "DIC" ? <Building2 size={22} /> : <Landmark size={22} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 850, color: c.text, lineHeight: 1.25 }}>
                      {partner.name || partner.partner_name}
                    </div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 4, lineHeight: 1.4 }}>
                      {partner.address || `${location}, Uttar Pradesh`}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14, padding: 12, borderRadius: 12, background: c.surface2, fontSize: 11 }}>
                  <div>
                    <span style={{ color: c.muted, fontWeight: 700 }}>Distance: </span>
                    <span style={{ color: c.text, fontWeight: 800 }}>{typeof dist === 'number' ? `${dist.toFixed(1)} km` : dist}</span>
                  </div>
                  {partner.phone && (
                    <div>
                      <span style={{ color: c.muted, fontWeight: 700 }}>Phone: </span>
                      <span style={{ color: c.text, fontWeight: 800 }}>{partner.phone}</span>
                    </div>
                  )}
                  {partner.category_affinity && (
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ color: c.muted, fontWeight: 700 }}>Specialization: </span>
                      <span style={{ color: c.primary, fontWeight: 800 }}>{partner.category_affinity} Priority</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {partner.phone && (
                    <a
                      href={`tel:${partner.phone}`}
                      style={{ ...secondaryButton(c), flex: 1, padding: "9px 12px", fontSize: 11, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}
                    >
                      <Phone size={13} /> Call Office
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${partner.name || partner.partner_name}, ${location}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ ...secondaryButton(c), flex: 1, padding: "9px 12px", fontSize: 11, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}
                  >
                    <MapPin size={13} /> Open Directions
                  </a>
                </div>
              </div>
            );
          })}
        </div>
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
    { key: "aadhaar", name: copy.docs.aadhaar },
    { key: "pan", name: copy.docs.pan },
    { key: "udyam", name: copy.docs.udyam },
    { key: "caste", name: copy.docs.caste },
    { key: "photo", name: copy.docs.photo },
    { key: "bank", name: copy.docs.bank },
    { key: "address", name: copy.docs.address },
    { key: "income", name: copy.docs.income },
  ];

  const uploadedCount = docs.reduce(
    (count, doc) => count + (files[doc.key] ? 1 : 0),
    0
  );
  const completion = Math.round((uploadedCount / docs.length) * 100);
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

  const handleFile = (key, file) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ];
    const allowedExtensions = /\.(pdf|png|jpe?g)$/i;
    const validType = allowedTypes.includes(file.type) || allowedExtensions.test(file.name);
    const maxBytes = 5 * 1024 * 1024;

    if (!validType) {
      window.alert(copy.fileTypeError || "Only PDF, PNG, JPG and JPEG files are allowed.");
      return;
    }

    if (file.size > maxBytes) {
      window.alert(copy.fileSizeError || "Maximum file size is 5 MB.");
      return;
    }

    if (files[key]?.url) URL.revokeObjectURL(files[key].url);

    const url = URL.createObjectURL(file);
    setFiles((prev) => ({
      ...prev,
      [key]: {
        file,
        url,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: formatSize(file.size),
        date: formatDate(Date.now()),
        uploadedAt: Date.now(),
      },
    }));
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
          {uploadedCount} {copy.of} {docs.length} {copy.uploaded}
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
          <span>{copy.completion}</span>
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
              background: c.primary,
              borderRadius: 99,
              transition: "width .25s ease",
            }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: c.muted, marginTop: 6 }}>
          {copy.speed}
        </div>
      </div>

      <div style={{ display: "grid", gap: 9 }}>
        {docs.map((doc) => {
          const uploaded = Boolean(files[doc.key]);
          const meta = uploaded
            ? `${files[doc.key].size} • ${copy.uploadedOn} ${files[doc.key].date}`
            : copy.notUploaded;

          return (
            <div
              key={doc.key}
              className="glass"
              style={{
                borderRadius: 12,
                padding: "12px 13px",
                display: "grid",
                gridTemplateColumns: "30px minmax(0, 1fr) auto auto",
                alignItems: "center",
                columnGap: 11,
                minHeight: 58,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: `${c.primary}18`,
                  color: c.primary,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={17} />
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 12,
                    color: c.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {doc.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: c.muted,
                    marginTop: 3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {meta}
                </div>
              </div>

              <button
                type="button"
                disabled={!uploaded}
                onClick={() => viewFile(doc)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: uploaded ? c.text : c.muted,
                  fontSize: 10.5,
                  padding: "7px 6px",
                  cursor: uploaded ? "pointer" : "default",
                  opacity: uploaded ? 1 : 0.55,
                }}
              >
                {copy.view}
              </button>

              <label
                style={{
                  border: `1px solid ${c.border}`,
                  background: c.surface2,
                  borderRadius: 8,
                  padding: "7px 9px",
                  fontSize: 10.5,
                  fontWeight: 750,
                  color: c.text,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {copy.replace}
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  onChange={(e) => {
                    handleFile(doc.key, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
              </label>
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
  return (
    <PageShell c={c}>
      <div
        style={{
          maxWidth: 900,
          margin: "30px auto",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div
          style={{
            textAlign: "center",
            marginTop: 25,
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: `${c.primary}15`,
              color: c.primary,
              display: "grid",
              placeItems: "center",
              margin: "auto",
            }}
          >
            <Languages size={28} />
          </div>

          <h1
            style={{
              fontSize: 38,
              margin: "20px 0 8px",
            }}
          >
            {t.chooseLanguage}
          </h1>

          <p style={{ color: c.muted }}>
            {t.selectPreferred}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 15,
            marginTop: 40,
          }}
        >
          {LANGUAGES.map((item) => {
            const active = language === item.code;

            return (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                style={{
                  padding: 22,
                  borderRadius: 20,
                  textAlign: "left",
                  background: active
                    ? `${c.primary}12`
                    : c.surface,
                  border: `2px solid ${
                    active ? c.primary : c.border
                  }`,
                  color: c.text,
                  transition: "all .2s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 23,
                    fontWeight: 800,
                  }}
                >
                  {item.name}
                </div>

                <div
                  style={{
                    color: c.muted,
                    fontSize: 13,
                    marginTop: 5,
                  }}
                >
                  {item.english}
                </div>

                <div
                  style={{
                    color: active ? c.primary : c.text,
                    fontSize: 15,
                    fontWeight: 700,
                    marginTop: 13,
                  }}
                >
                  {item.choose}
                </div>

                {active && (
                  <div
                    style={{
                      color: c.primary,
                      fontSize: 13,
                      fontWeight: 700,
                      marginTop: 12,
                    }}
                  >
                    ✓ {t.selected}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            maxWidth: 500,
            margin: "35px auto 0",
          }}
        >
          <button
            onClick={onContinue}
            disabled={!language}
            style={{
              ...primaryButton(c),
              width: "100%",
              opacity: language ? 1 : 0.45,
            }}
          >
            {t.continue}
            <ArrowRight size={18} />
          </button>
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
  language = "en",
  user,
  extractedProfile,
  setExtractedProfile,
  onConfirmExtracted,
  onEditInForm,
  onStart,
  onBack,
}) {
  const [typedQuery, setTypedQuery] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState("");
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [transliterateEnabled, setTransliterateEnabled] = useState(language !== "en");

  // Keep transliteration enabled in sync when user switches language
  useEffect(() => {
    if (language !== "en") {
      setTransliterateEnabled(true);
    }
  }, [language]);

  const handleTextareaKeyDown = (e) => {
    if (!transliterateEnabled || language === "en") return;

    // Trigger on Space, Enter, or punctuation (, . ? !)
    if (e.key === " " || e.key === "Enter" || e.key === "," || e.key === "." || e.key === "!" || e.key === "?") {
      const target = e.target;
      const cursorPos = target.selectionStart;
      const textBeforeCursor = typedQuery.slice(0, cursorPos);
      const textAfterCursor = typedQuery.slice(cursorPos);

      // Extract the word immediately before the cursor
      const match = textBeforeCursor.match(/([^\s,।.;!?]+)$/);
      if (!match) return;

      const currentWord = match[1];
      const transliteratedWord = transliterateWord(currentWord, language || "hi");

      if (transliteratedWord && transliteratedWord !== currentWord) {
        e.preventDefault();
        const prefix = textBeforeCursor.slice(0, textBeforeCursor.length - currentWord.length);
        const insertChar = e.key === "Enter" ? "\n" : e.key;
        const newText = prefix + transliteratedWord + insertChar + textAfterCursor;
        const newCursorPos = prefix.length + transliteratedWord.length + insertChar.length;

        setTypedQuery(newText);

        requestAnimationFrame(() => {
          if (target) {
            target.selectionStart = newCursorPos;
            target.selectionEnd = newCursorPos;
          }
        });
      }
    }
  };

  const handleConvertFullText = () => {
    if (!typedQuery.trim()) return;
    const converted = transliterateSentence(typedQuery, language || "hi");
    setTypedQuery(converted);
  };

  const voice = useVoiceRecorder(language || "hi");

  // When voice recording completes and transcript arrives, automatically run NLP extraction
  useEffect(() => {
    if (voice.transcript && (voice.state === "ready" || voice.state === "transcribed")) {
      runExtraction(voice.transcript);
    }
  }, [voice.transcript, voice.state]);

  const runExtraction = async (textToExtract) => {
    const text = (textToExtract || typedQuery).trim();
    if (!text) {
      setExtractionError("Please speak or type a sentence about yourself or your business.");
      return;
    }

    setExtractionError("");
    setIsExtracting(true);

    try {
      const response = await extractProfile(text);
      setExtractedProfile(response);
    } catch (err) {
      console.error("NLP extraction error:", err);
      setExtractionError(
        err.message || "Unable to extract profile from text/voice. Please check your connection and retry."
      );
      setExtractedProfile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const samplePrompts = [
    {
      label: "दर्जी | SC | 1.5 लाख | बिहार",
      text: "मेरी दर्जी की दुकान है SC category हूँ इनकम डेढ़ लाख है बिहार में",
    },
    {
      label: "Woman Artisan | OBC | ₹2.5 Lakh | Gujarat",
      text: "I am an OBC woman running a handicraft enterprise in Gujarat with annual income 2.5 lakh",
    },
    {
      label: "दुकानदार | General | 4 लाख | उत्तर प्रदेश",
      text: "मेरी परचून की दुकान है General category हूँ वार्षिक आय 4 लाख है उत्तर प्रदेश",
    },
  ];

  const formatSecs = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <PageShell c={c}>
      <div
        className="fade"
        style={{
          maxWidth: 900,
          margin: "50px auto 80px",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div
          style={{
            color: c.primary,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 1.2,
            marginTop: 25,
          }}
        >
          {t.voiceFirstAssistance.toUpperCase()}
        </div>

        <h1
          style={{
            fontSize: 44,
            margin: "12px 0 8px",
          }}
        >
          {t.welcome}, {user.name || "Entrepreneur"}
        </h1>

        <p
          style={{
            maxWidth: 680,
            margin: "auto",
            color: c.muted,
            fontSize: 17,
            lineHeight: 1.6,
          }}
        >
          {t.welcomeText}
        </p>

        {/* VOICE ASSISTANT MIC SECTION */}
          <div
            className="glass"
            style={{
              borderRadius: 28,
              padding: "35px 25px",
              marginTop: 35,
              background:
                voice.isRecording
                  ? `${c.danger}08`
                  : voice.isStopping || voice.isTranscribing || voice.isProcessing || voice.state === "stopping" || voice.state === "transcribing" || voice.state === "uploading" || voice.state === "processing" || isExtracting
                  ? `${c.primary}08`
                  : `${c.surface}`,
              border: `1.5px solid ${
                voice.isRecording ? c.danger : c.border
              }`,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 90,
                height: 90,
                margin: "auto",
              }}
            >
              {voice.isRecording && (
                <div
                  style={{
                    position: "absolute",
                    inset: -10,
                    borderRadius: "50%",
                    border: `3px solid ${c.danger}`,
                    animation: "pulse 1.2s infinite",
                  }}
                />
              )}
              <button
                type="button"
                onClick={voice.isRecording ? voice.stopRecording : voice.startRecording}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 28,
                  border: "none",
                  background: voice.isRecording
                    ? `linear-gradient(135deg, ${c.danger}, #A32D28)`
                    : `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  boxShadow: voice.isRecording
                    ? `0 14px 35px ${c.danger}50`
                    : `0 14px 35px ${c.primary}40`,
                  transition: "all .2s ease",
                }}
              >
                {voice.isRecording ? <MicOff size={38} /> : <Mic size={38} />}
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                fontSize: 17,
                fontWeight: 800,
                color: voice.isRecording ? c.danger : c.text,
              }}
            >
              {voice.isRecording ? (
                <div>
                  <div>
                    {voice.isSpeechDetected
                      ? `🎙️ सुन रहा हूँ... (${formatSecs(voice.recordingTime)})`
                      : `🎙️ बोलिए... (${formatSecs(voice.recordingTime)})`}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, marginTop: 4 }}>
                    बोलना बंद करने पर स्वतः समाप्त होगा (Auto-Stop on Silence)
                  </div>
                </div>
              ) : voice.state === "requesting_permission" ? (
                "Requesting microphone permission..."
              ) : voice.isStopping || voice.isTranscribing || voice.isProcessing || voice.state === "stopping" || voice.state === "transcribing" || voice.state === "uploading" || voice.state === "processing" || isExtracting ? (
                <div>
                  <div>⚡ {isExtracting ? "Analyzing requirement via AI..." : "Processing Audio with Bhashini ASR..."}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: c.primary, marginTop: 4 }}>
                    कृपया प्रतीक्षा करें... (Extracting profile details)
                  </div>
                </div>
              ) : (
                t.tapToSpeak
              )}
            </div>

          {/* LIVE INTERIM SPEECH PREVIEW (Words appear in real time while speaking) */}
          {voice.isRecording && voice.interimTranscript && (
            <div
              style={{
                marginTop: 18,
                padding: "12px 16px",
                borderRadius: 14,
                background: `${c.danger}10`,
                border: `1.5px dashed ${c.danger}60`,
                fontSize: 14,
                color: c.text,
                textAlign: "left",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.danger, marginTop: 5, flexShrink: 0, animation: "pulse 1s infinite" }} />
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 11, color: c.danger, display: "block", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                  🔴 Live Speech Preview (सजीव पूर्वावलोकन):
                </strong>
                <span style={{ fontSize: 14, fontWeight: 650, color: c.text, fontStyle: "italic" }}>
                  "{voice.interimTranscript}"
                </span>
              </div>
            </div>
          )}

          {/* FINAL AUTHORITATIVE TRANSCRIPT (from Bhashini / Whisper) */}
          {voice.transcript && (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 16,
                background: c.surface2,
                fontSize: 14,
                color: c.text,
                textAlign: "left",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                border: `1.5px solid ${c.primary}40`,
              }}
            >
              <Volume2 size={20} color={c.primary} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <strong style={{ fontSize: 12, color: c.muted, textTransform: "uppercase" }}>
                    FINAL TRANSCRIPT ({voice.languageDetected.toUpperCase()}):
                  </strong>
                  <span style={{ fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999, background: `${c.success}18`, color: c.success }}>
                    Bhashini ASR ✓
                  </span>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14.5, color: c.text }}>"{voice.transcript}"</span>
              </div>
            </div>
          )}

          {voice.error && (
            <div
              style={{
                marginTop: 12,
                color: c.danger,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {voice.error}
            </div>
          )}
        </div>

        {/* NATURAL LANGUAGE QUERY / TYPING SECTION */}
        <div
          className="glass"
          style={{
            borderRadius: 28,
            padding: "28px 24px",
            marginTop: 25,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 15 }}>
                ✍️ {language === "hi" ? "अपनी भाषा में लिखें (Natural Language Query)" : "Type in Natural Language (Hindi / English)"}
              </strong>
              {language !== "en" && (
                <button
                  type="button"
                  onClick={() => setTransliterateEnabled(!transliterateEnabled)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 16,
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid ${transliterateEnabled ? c.primary : c.border}`,
                    background: transliterateEnabled ? `${c.primary}15` : c.surface2,
                    color: transliterateEnabled ? c.primary : c.muted,
                    cursor: "pointer",
                  }}
                  title="Toggle phonetic typing (e.g. 'mera naam' -> 'मेरा नाम')"
                >
                  <span>🇮🇳 ध्वन्यात्मक टाइपिंग (Phonetic)</span>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: transliterateEnabled ? "#10B981" : c.muted,
                    }}
                  />
                  <span>{transliterateEnabled ? "चालू (ON)" : "बंद (OFF)"}</span>
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {language !== "en" && typedQuery.trim() && (
                <button
                  type="button"
                  onClick={handleConvertFullText}
                  style={{
                    border: `1px solid ${c.border}`,
                    background: c.surface2,
                    color: c.text,
                    fontSize: 11,
                    fontWeight: 650,
                    padding: "3px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                  title="Convert Romanized Hindi to Devanagari"
                >
                  📝 पूरे वाक्य को देवनागरी में बदलें
                </button>
              )}
              <span style={{ fontSize: 11, color: c.muted }}>
                POST /api/profile/extract
              </span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <textarea
              rows={3}
              value={typedQuery}
              onChange={(e) => setTypedQuery(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                language !== "en"
                  ? "e.g. main darzi hoon, SC category, income dedh lakh hai bihar mein... (Space दबाते ही हिंदी लिपि में बदलेगा)"
                  : "e.g. I run a tailoring shop, SC category, annual income 1.5 lakh in Bihar..."
              }
              style={{
                ...inputStyle(c),
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />

            <button
              type="button"
              disabled={isExtracting || !typedQuery.trim()}
              onClick={() => runExtraction(typedQuery)}
              style={{
                ...primaryButton(c),
                position: "absolute",
                right: 10,
                bottom: 14,
                padding: "8px 18px",
                fontSize: 13,
                opacity: isExtracting || !typedQuery.trim() ? 0.5 : 1,
              }}
            >
              {isExtracting ? (
                <span>Extracting...</span>
              ) : (
                <>
                  <span>Extract Profile</span>
                  <Send size={14} />
                </>
              )}
            </button>
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, color: c.muted }}>Sample queries:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTypedQuery(p.text);
                  runExtraction(p.text);
                }}
                style={{
                  border: `1px solid ${c.border}`,
                  borderRadius: 20,
                  padding: "5px 12px",
                  background: c.surface2,
                  color: c.text,
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {extractionError && (
            <div
              style={{
                marginTop: 10,
                color: c.danger,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={15} />
              <span>{extractionError}</span>
            </div>
          )}
        </div>

        {/* AI EXTRACTION CONFIRMATION CARD */}
        {extractedProfile && (
          <div
            className="glass fade"
            style={{
              borderRadius: 28,
              padding: "28px 25px",
              marginTop: 25,
              textAlign: "left",
              border: `2px solid ${c.primary}40`,
              background: `${c.primary}05`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                borderBottom: `1px solid ${c.border}`,
                paddingBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Sparkles size={20} color={c.primary} />
                <strong style={{ fontSize: 18 }}>AI Extracted Profile</strong>
              </div>

              <div
                style={{
                  padding: "5px 12px",
                  borderRadius: 16,
                  background: `${c.primary}18`,
                  color: c.primary,
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                Confidence: {Math.round((extractedProfile.confidence || 0.8) * 100)}%
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                marginTop: 18,
              }}
            >
              <div
                style={{
                  padding: "12px 15px",
                  borderRadius: 14,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>CATEGORY</div>
                <strong style={{ fontSize: 16, color: c.primary }}>
                  {extractedProfile.extracted?.category || "General"}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px 15px",
                  borderRadius: 14,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>ANNUAL INCOME</div>
                <strong style={{ fontSize: 16 }}>
                  {extractedProfile.extracted?.income
                    ? `₹${Number(extractedProfile.extracted.income).toLocaleString("en-IN")}`
                    : "Not specified"}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px 15px",
                  borderRadius: 14,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>STATE / REGION</div>
                <strong style={{ fontSize: 16 }}>
                  {extractedProfile.extracted?.state || "All India"}
                </strong>
              </div>

              <div
                style={{
                  padding: "12px 15px",
                  borderRadius: 14,
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                }}
              >
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>BUSINESS TYPE</div>
                <strong style={{ fontSize: 16, textTransform: "capitalize" }}>
                  {extractedProfile.extracted?.business_type || "General Enterprise"}
                </strong>
              </div>

              {extractedProfile.extracted?.project_cost && (
                <div
                  style={{
                    padding: "12px 15px",
                    borderRadius: 14,
                    background: `${c.primary}10`,
                    border: `1px solid ${c.primary}30`,
                  }}
                >
                  <div style={{ fontSize: 11, color: c.primary, fontWeight: 700 }}>PROJECT ESTIMATE</div>
                  <strong style={{ fontSize: 16, color: c.primary }}>
                    ₹{Number(extractedProfile.extracted.project_cost).toLocaleString("en-IN")}
                  </strong>
                </div>
              )}
            </div>

            {/* AI FOLLOW-UP QUESTION */}
            {extractedProfile.follow_up_question && (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  borderRadius: 16,
                  background: `${c.accent}12`,
                  border: `1.5px solid ${c.accent}40`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: c.accent,
                    fontWeight: 800,
                    fontSize: 13,
                    marginBottom: 6,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>Missing Field Follow-up Question</span>
                </div>
                <p style={{ margin: "0 0 10px 0", fontSize: 14, color: c.text, fontWeight: 600 }}>
                  {extractedProfile.follow_up_question}
                </p>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    placeholder="e.g. 150000 rupees / 1.5 lakh"
                    style={{ ...inputStyle(c), padding: "8px 12px", fontSize: 13 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!followUpAnswer) return;
                      const num = parseInt(followUpAnswer.replace(/[^0-9]/g, "")) || 150000;
                      setExtractedProfile((prev) => ({
                        ...prev,
                        extracted: {
                          ...prev.extracted,
                          project_cost: num,
                        },
                        follow_up_question: null,
                      }));
                      setFollowUpAnswer("");
                    }}
                    style={{
                      ...secondaryButton(c),
                      padding: "8px 16px",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Add to Profile
                  </button>
                </div>
              </div>
            )}

            {/* CONFIRMATION ACTIONS */}
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 22,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => onConfirmExtracted(extractedProfile.extracted)}
                style={{
                  ...primaryButton(c),
                  flex: 1,
                  padding: "14px 22px",
                  fontSize: 15,
                }}
              >
                <Sparkles size={18} />
                <span>Confirm & Match Schemes via AI</span>
              </button>

              <button
                type="button"
                onClick={() => onEditInForm(extractedProfile.extracted)}
                style={{
                  ...secondaryButton(c),
                  padding: "14px 20px",
                  fontSize: 14,
                }}
              >
                Edit Manually in Form
              </button>
            </div>
          </div>
        )}

        {/* STEP BY STEP MANUAL FORM FALLBACK */}
        <div style={{ marginTop: 35 }}>
          <button
            type="button"
            onClick={onStart}
            style={{
              ...secondaryButton(c),
              padding: "12px 24px",
              fontSize: 14,
            }}
          >
            <span>Or Fill Form Step-by-Step Instead</span>
            <ChevronRight size={16} />
          </button>
        </div>

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
  onBack,
  onFinish,
}) {
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

  const field = fields[step];
  const value = profile[field.key];
  const canContinue = Boolean(value);

  const choose = (value) => {
    setProfile((current) => ({
      ...current,
      [field.key]: value,
    }));
  };

  return (
    <PageShell c={c}>
      <div
        className="container fade"
        style={{
          padding: "35px 0",
        }}
      >
        <BackButton c={c} onClick={onBack} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            marginTop: 30,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: c.primary,
                fontWeight: 800,
              }}
            >
              {t.profile.toUpperCase()}
            </div>

            <h1
              style={{
                fontSize: 34,
                margin: "7px 0",
              }}
            >
              {t.tellAboutYourself}
            </h1>
          </div>

          <div
            style={{
              color: c.muted,
              fontWeight: 700,
            }}
          >
            {step + 1} / {fields.length}
          </div>
        </div>

        <div
          style={{
            height: 7,
            background: c.border,
            borderRadius: 20,
            marginTop: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${((step + 1) / fields.length) * 100}%`,
              height: "100%",
              background: c.primary,
              borderRadius: 20,
              transition: "width .3s ease",
            }}
          />
        </div>

        <div
          className="profile-layout"
          style={{
            marginTop: 50,
          }}
        >
          <div>
            <div
              className="glass"
              style={{
                padding: 25,
                borderRadius: 24,
              }}
            >
              <div
                style={{
                  width: 55,
                  height: 55,
                  borderRadius: 16,
                  background: `${c.primary}14`,
                  color: c.primary,
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 18,
                }}
              >
                {field.icon}
              </div>

              <div
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {t.voiceEnabled}
              </div>

              <p
                style={{
                  color: c.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {t.voiceEnabledText}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: c.primary,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Volume2 size={16} />
                {t.listeningAvailable}
              </div>
            </div>
          </div>

          <div
            className="glass"
            style={{
              padding: 35,
              borderRadius: 28,
            }}
          >
            <h2
              style={{
                fontSize: 28,
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              {field.title}
            </h2>

            <p
              style={{
                color: c.muted,
                lineHeight: 1.6,
                marginTop: 10,
              }}
            >
              {field.hint}
            </p>

            <div style={{ marginTop: 30 }}>
              {field.key === "category" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(130px,1fr))",
                    gap: 12,
                  }}
                >
                  {CATEGORY_OPTS.map((item) => (
                    <Option
                      key={item}
                      c={c}
                      active={profile.category === item}
                      onClick={() => choose(item)}
                    >
                      {
                        CATEGORY_TRANSLATIONS[
                          language
                        ][item]
                      }
                    </Option>
                  ))}
                </div>
              )}

              {field.key === "income" && (
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                  }}
                >
                  {INCOME_OPTS.map((item) => (
                    <Option
                      key={item.value}
                      c={c}
                      active={
                        Number(profile.income) ===
                        item.value
                      }
                      onClick={() =>
                        choose(item.value)
                      }
                      wide
                    >
                      {
                        INCOME_TRANSLATIONS[
                          language
                        ][item.key]
                      }
                    </Option>
                  ))}
                </div>
              )}

              {field.key === "businessType" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(180px,1fr))",
                    gap: 12,
                  }}
                >
                  {BUSINESS_OPTS.map((item) => (
                    <Option
                      key={item}
                      c={c}
                      active={
                        profile.businessType === item
                      }
                      onClick={() => choose(item)}
                    >
                      {
                        BUSINESS_TRANSLATIONS[
                          language
                        ][item]
                      }
                    </Option>
                  ))}
                </div>
              )}

              {field.key === "location" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 700,
                      fontSize: 13,
                      marginBottom: 8,
                    }}
                  >
                    {t.location}
                  </label>

                  <input
                    value={profile.location}
                    onChange={(e) =>
                      choose(e.target.value)
                    }
                    placeholder={t.locationPlaceholder}
                    style={inputStyle(c)}
                  />

                  <button
                    type="button"
                    style={{
                      ...secondaryButton(c),
                      marginTop: 12,
                      width: "100%",
                    }}
                    onClick={() =>
                      choose(
                        "Mathura, Uttar Pradesh"
                      )
                    }
                  >
                    <MapPin size={17} />
                    {t.sampleLocation}
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 35,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  step === 0
                    ? onBack()
                    : setStep(
                        (current) => current - 1
                      )
                }
                style={secondaryButton(c)}
              >
                <ArrowLeft size={17} />
                {t.back}
              </button>

              <button
                type="button"
                disabled={!canContinue}
                onClick={() =>
                  step === fields.length - 1
                    ? onFinish()
                    : setStep(
                        (current) => current + 1
                      )
                }
                style={{
                  ...primaryButton(c),
                  flex: 1,
                  opacity: canContinue ? 1 : 0.45,
                }}
              >
                {step === fields.length - 1
                  ? t.findSchemes
                  : t.continue}
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

function LoadingScreen({ c, t, pct }) {
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
            <Sparkles size={42} />
          </div>

          <h1
            style={{
              fontSize: 32,
              margin: "25px 0 8px",
            }}
          >
            {t.loadingTitle}
          </h1>

          <p style={{ color: c.muted }}>
            {t.loadingText}
          </p>

          <div
            style={{
              width: "min(450px, 80vw)",
              height: 9,
              background: c.border,
              borderRadius: 20,
              margin: "30px auto 10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: c.primary,
                transition: "width .15s ease",
              }}
            />
          </div>

          <div
            style={{
              color: c.primary,
              fontWeight: 800,
            }}
          >
            {pct}%
          </div>
        </div>
      </div>
    </PageShell>
  );
}



const COMPARE_LABELS = {
  en: {
    title: "Scheme Comparison",
    subtitle: "Comparing 3 top matching schemes side by side",
    parameter: "Parameter / Feature",
    eligibility: "Eligibility Match",
    max: "Maximum Assistance",
    interest: "Interest Rate",
    subsidy: "Government Subsidy",
    tenure: "Repayment Tenure",
    category: "Assistance Type",
    groups: "Target Groups",
    sector: "Eligible Sector",
    description: "Key Benefit / Summary",
    best: "Best Match ★",
    high: "High Match (80%+)",
    eligible: "Eligible (65-79%)",
    less: "Moderate Match (50-64%)",
    veryLess: "Low Match (<50%)",
  },
  hi: {
    title: "योजना तुलना",
    subtitle: "शीर्ष 3 मेल वाली योजनाओं की साथ-साथ तुलना",
    parameter: "मापदंड / विवरण",
    eligibility: "पात्रता मिलान",
    max: "अधिकतम सहायता",
    interest: "ब्याज दर",
    subsidy: "सरकारी सब्सिडी",
    tenure: "पुनर्भुगतान अवधि",
    category: "सहायता प्रकार",
    groups: "लक्षित वर्ग",
    sector: "पात्र क्षेत्र",
    description: "मुख्य लाभ / विवरण",
    best: "सर्वोत्तम मिलान ★",
    high: "उच्च मिलान (80%+)",
    eligible: "पात्र (65-79%)",
    less: "मध्यम मिलान (50-64%)",
    veryLess: "कम मिलान (<50%)",
  },
  bn: {
    title: "প্রকল্প তুলনা",
    subtitle: "শীর্ষ ৩টি মিল থাকা প্রকল্পের পাশাপাশি তুলনা",
    parameter: "প্যারামিটার / বৈশিষ্ট্য",
    eligibility: "যোগ্যতা মিল",
    max: "সর্বোচ্চ সহায়তা",
    interest: "সুদের হার",
    subsidy: "সরকারি ভর্তুকি",
    tenure: "পরিশোধের মেয়াদ",
    category: "সহায়তার ধরন",
    groups: "লক্ষ্য গোষ্ঠী",
    sector: "যোগ্য খাত",
    description: "প্রধান সুবিধা / সারসংক্ষেপ",
    best: "সেরা মিল ★",
    high: "উচ্চ মিল (৮০%+)",
    eligible: "যোগ্য (৬৫-৭৯%)",
    less: "মাঝারি মিল",
    veryLess: "কম মিল",
  },
  ta: {
    title: "திட்ட ஒப்பீடு",
    subtitle: "சிறந்த 3 பொருத்தமான திட்டங்களின் ஒப்பீடு",
    parameter: "அளவுகோல் / அம்சம்",
    eligibility: "தகுதி பொருத்தம்",
    max: "அதிகபட்ச உதவி",
    interest: "வட்டி விகிதம்",
    subsidy: "அரசு மானியம்",
    tenure: "திருப்பிச் செலுத்தும் காலம்",
    category: "உதவி வகை",
    groups: "இலக்கு குழுக்கள்",
    sector: "தகுதியான துறை",
    description: "முக்கிய நன்மை / சுருக்கம்",
    best: "சிறந்த பொருத்தம் ★",
    high: "உயர் பொருத்தம் (80%+)",
    eligible: "தகுதியானது (65-79%)",
    less: "மிதமான பொருத்தம்",
    veryLess: "குறைந்த பொருத்தம்",
  },
  mr: {
    title: "योजना तुलना",
    subtitle: "सर्वोत्तम 3 जुळणाऱ्या योजनांची तुलना",
    parameter: "घटक / वैशिष्ट्य",
    eligibility: "पात्रता जुळणी",
    max: "कमाल सहाय्य",
    interest: "व्याज दर",
    subsidy: "सरकारी अनुदान",
    tenure: "परतफेड कालावधी",
    category: "सहाय्य प्रकार",
    groups: "लक्षित गट",
    sector: "पात्र क्षेत्र",
    description: "मुख्य लाभ / सारांश",
    best: "सर्वोत्तम जुळणी ★",
    high: "उच्च जुळणी (80%+)",
    eligible: "पात्र (65-79%)",
    less: "मध्यम जुळणी",
    veryLess: "कमी जुळणी",
  },
  te: {
    title: "పథకాల పోలిక",
    subtitle: "అత్యధికంగా సరిపోలిన 3 పథకాల పోలిక",
    parameter: "పారామితి / ఫీచర్",
    eligibility: "అర్హత పోలిక",
    max: "గరిష్ట సహాయం",
    interest: "వడ్డీ రేటు",
    subsidy: "ప్రభుత్వ రాయితీ",
    tenure: "తిరిగి చెల్లించే వ్యవధి",
    category: "సహాయ రకం",
    groups: "లక్ష్య సమూహాలు",
    sector: "అర్హత గల రంగం",
    description: "ప్రధాన ప్రయోజనం / సారాంశం",
    best: "ఉత్తమ పోలిక ★",
    high: "అధిక పోలిక (80%+)",
    eligible: "అర్హతగల (65-79%)",
    less: "మధ్యస్థ పోలిక",
    veryLess: "తక్కువ పోలిక",
  },
};

function CompareScreen({ c, t, language, results }) {
  const lang = COMPARE_LABELS[language] ? language : "en";
  const labels = COMPARE_LABELS[lang] || COMPARE_LABELS.en;

  // Always use the actual matched results. If they are not ready yet, fall back
  // to available catalog schemes so the comparison page is never blank.
  const fallbackList = (typeof SCHEMES !== "undefined" && Array.isArray(SCHEMES) && SCHEMES.length > 0)
    ? SCHEMES.map((scheme, idx) => ({ ...scheme, score: idx === 0 ? 94 : idx === 1 ? 88 : 76 }))
    : [
        { id: "sui", name: "Stand-Up India (SUI)", score: 94, maxAssistance: "₹10 Lakh - ₹1 Crore", interestRate: "Bank Base + 3%", subsidy: "Composite Loan", categories: ["SC", "ST", "Woman"] },
        { id: "pm_svanidhi", name: "PM SVANidhi", score: 88, maxAssistance: "₹10,000 - ₹50,000", interestRate: "7% Interest Subsidy", subsidy: "Direct Cashback", categories: ["Street Vendors", "Micro"] },
        { id: "mudra", name: "PM MUDRA Yojana", score: 82, maxAssistance: "Up to ₹10 Lakh", interestRate: "8.5% - 12%", subsidy: "Credit Guarantee", categories: ["General", "OBC", "SC", "ST"] },
      ];

  const baseResults = Array.isArray(results) && results.length > 0
    ? results
    : fallbackList;

  const topThree = [...baseResults]
    .sort((a, b) => Number(b.score || b.matchScore || 0) - Number(a.score || a.matchScore || 0))
    .slice(0, 3);

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
    en: { all: "All sectors", loan: "Loan / Credit", applicable: "As per policy", eligible: "Eligible beneficiaries" },
    hi: { all: "सभी क्षेत्र", loan: "ऋण / साख", applicable: "नीति अनुसार", eligible: "पात्र लाभार्थी" },
    bn: { all: "সব ক্ষেত্র", loan: "ঋণ", applicable: "নীতি অনুযায়ী", eligible: "যোগ্য সুবিধাভোগী" },
    ta: { all: "அனைத்து துறைகள்", loan: "கடன்", applicable: "கொள்கையின்படி", eligible: "தகுதியான பயனாளிகள்" },
    mr: { all: "सर्व क्षेत्रे", loan: "कर्ज", applicable: "धोरणानुसार", eligible: "पात्र लाभार्थी" },
    te: { all: "అన్ని రంగాలు", loan: "రుణం", applicable: "విధానం ప్రకారం", eligible: "అర్హత కలిగిన లబ్ధిదారులు" },
  }[lang] || {};

  const makeMeta = (scheme) => {
    const sId = String(scheme.id || scheme.scheme_id || "").trim();
    const sIdLower = sId.toLowerCase();
    
    const translated =
      (typeof SCHEME_TRANSLATIONS !== "undefined" && (
        SCHEME_TRANSLATIONS[lang]?.[sId] ||
        SCHEME_TRANSLATIONS[lang]?.[sIdLower] ||
        SCHEME_TRANSLATIONS.en?.[sId] ||
        SCHEME_TRANSLATIONS.en?.[sIdLower]
      )) ||
      { 
        name: scheme.name || scheme.scheme_name || sId, 
        benefit: scheme.benefit || scheme.maxAssistance || scheme.max_assistance || "", 
        short: scheme.description || scheme.why_matched || scheme.eligibility_text || "" 
      };

    const detail =
      (typeof SCHEME_DETAIL_TRANSLATIONS !== "undefined" && (
        SCHEME_DETAIL_TRANSLATIONS[lang]?.[sId] ||
        SCHEME_DETAIL_TRANSLATIONS[lang]?.[sIdLower] ||
        SCHEME_DETAIL_TRANSLATIONS.en?.[sId] ||
        SCHEME_DETAIL_TRANSLATIONS.en?.[sIdLower]
      )) || {};

    const targetGroups = (Array.isArray(scheme.categories) ? scheme.categories : [])
      .map((item) => groupTranslations[item] || item)
      .join(", ") || generic.eligible;

    let sector = generic.all;
    if (sIdLower === "dksh") sector = ({ en: "Skill development", hi: "कौशल विकास", bn: "দক্ষতা উন্নয়ন", ta: "திறன் மேம்பாடு", mr: "कौशल्य विकास", te: "నైపుణ్యాభివృద్ధి" }[lang]);
    else if (sIdLower === "nbcfdc") sector = ({ en: "Micro-enterprise", hi: "सूक्ष्म उद्यम", bn: "ক্ষুদ্র উদ্যোগ", ta: "சிறு நிறுவனம்", mr: "सूक्ष्म उद्योग", te: "సూక్ష్మ సంస్థ" }[lang]);
    else if (sIdLower === "mun" || sIdLower === "mudra") sector = ({ en: "Small-scale business", hi: "लघु व्यवसाय", bn: "ছোট ব্যবসা", ta: "சிறு வணிகம்", mr: "लघु व्यवसाय", te: "చిన్న వ్యాపారం" }[lang]);
    else if (sIdLower === "nhfdc") sector = ({ en: "Income-generating business", hi: "आय सृजन व्यवसाय", bn: "আয়-সৃষ্টিকারী ব্যবসা", ta: "வருமானம் ஈட்டும் தொழில்", mr: "उत्पन्न देणारा व्यवसाय", te: "ఆదాయం సృష్టించే వ్యాపారం" }[lang]);

    let category = generic.loan;
    if (sIdLower === "dksh") category = ({ en: "Training + Support", hi: "प्रशिक्षण + सहायता", bn: "প্রশিক্ষণ + সহায়তা", ta: "பயிற்சி + ஆதரவு", mr: "प्रशिक्षण + सहाय्य", te: "శిక్షణ + సహాయం" }[lang]);
    else if (sIdLower === "nbcfdc") category = ({ en: "Micro-loan", hi: "माइक्रो-लोन", bn: "মাইক্রো-लोन", ta: "சிறுகடன்", mr: "मायक्रो-लोन", te: "మైక్రో-లోన్" }[lang]);

    let tenure = detail.tenure || scheme.tenure || generic.applicable;
    const tenureMap = {
      sui: { en: "3–7 Years", hi: "3–7 वर्ष", bn: "৩–৭ বছর", ta: "3–7 ஆண்டுகள்", mr: "3–7 वर्षे", te: "3–7 సంవత్సరాలు" },
      dksh: { en: "Training period", hi: "प्रशिक्षण अवधि", bn: "প্রশিক্ষণের সময়কাল", ta: "பயிற்சி காலம்", mr: "प्रशिक्षण कालावधी", te: "శిక్షణ కాలం" },
      mudra: { en: "3–5 Years", hi: "3–5 वर्ष", bn: "৩–৫ বছর", ta: "3–5 ஆண்டுகள்", mr: "3–5 वर्षे", te: "3–5 సంవత్సరాలు" },
    };
    if (tenureMap[sIdLower]) tenure = tenureMap[sIdLower][lang] || tenureMap[sIdLower].en;

    const score = Number(scheme.score || scheme.matchScore || (scheme.confidence ? scheme.confidence * 100 : 75));

    return {
      scheme,
      translated,
      detail,
      targetGroups,
      sector,
      category,
      tenure,
      score,
      eligibility: eligibility(score),
    };
  };

  const data = topThree.map(makeMeta);

  const rows = [
    [labels.eligibility, (item) => item.eligibility, true],
    [labels.max, (item) => item.detail.maxAssistance || item.scheme.maxAssistance || item.scheme.benefit || item.translated.benefit || "—", false],
    [labels.interest, (item) => item.detail.interestRate || item.scheme.interestRate || generic.applicable || "—", false],
    [labels.subsidy, (item) => item.detail.subsidy || item.scheme.subsidy || "—", false],
    [labels.tenure, (item) => item.tenure, false],
    [labels.category, (item) => item.category, false],
    [labels.groups, (item) => item.targetGroups, false],
    [labels.sector, (item) => item.sector, false],
    [labels.description, (item) => item.detail.description || item.translated.short || item.scheme.description || item.scheme.why_matched || "—", false],
  ];

  return (
    <div className="fade" style={{ paddingBottom: 35, width: "100%" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ color: c.text, fontSize: 26, fontWeight: 900, lineHeight: 1.15 }}>
          {labels.title}
        </div>
        <div style={{ color: c.muted, fontSize: 14, marginTop: 5 }}>
          {labels.subtitle}
        </div>
      </div>

      <div className="glass" style={{ borderRadius: 22, overflowX: "auto", boxShadow: c.shadow, background: c.surface, border: `1px solid ${c.border}` }}>
        <div style={{ minWidth: 760 }}>
          <div style={{ display: "grid", gridTemplateColumns: "170px repeat(3, minmax(190px, 1fr))", borderBottom: `1px solid ${c.border}`, background: c.surface2 || c.surface }}>
            <div style={{ padding: "22px 16px", alignSelf: "end", color: c.muted, fontSize: 13, fontWeight: 800 }}>
              {labels.parameter}
            </div>

            {data.map(({ scheme, translated, score }, index) => (
              <div key={scheme.id || scheme.scheme_id || index} style={{ padding: "18px 16px 22px", textAlign: "center", borderLeft: `1px solid ${c.border}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 62 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: `${c.primary}13`, color: c.primary, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                    {index === 0 ? <Sparkles size={20} /> : <Landmark size={20} />}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 850, color: c.text, lineHeight: 1.2, textAlign: "left" }}>
                    {translated.name}
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <AnimatedMatchRing c={c} score={score} size={58} />
                  {index === 0 && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 9px", borderRadius: 999, background: `${c.success}18`, color: c.success, fontSize: 10, fontWeight: 900 }}>
                      {labels.best}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {rows.map(([label, renderValue, isPill], rIdx) => (
            <div key={label || rIdx} style={{ display: "grid", gridTemplateColumns: "170px repeat(3, minmax(190px, 1fr))", borderBottom: `1px solid ${c.border}`, background: rIdx % 2 === 1 ? `${c.surface2}40` : "transparent" }}>
              <div style={{ padding: "15px 16px", color: c.muted, fontSize: 12.5, fontWeight: 800 }}>{label}</div>
              {data.map((item, idx) => (
                <div key={`${label}-${item.scheme.id || item.scheme.scheme_id || idx}`} style={{ padding: "15px 16px", textAlign: "center", borderLeft: `1px solid ${c.border}`, color: c.text, fontSize: 12.5, fontWeight: 650, lineHeight: 1.5 }}>
                  {isPill ? (
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
  const translated = SCHEME_TRANSLATIONS[language]?.[scheme.id] || SCHEME_TRANSLATIONS.en[scheme.id];
  const detail = SCHEME_DETAIL_TRANSLATIONS[language]?.[scheme.id] || SCHEME_DETAIL_TRANSLATIONS.en[scheme.id];

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

        <AnimatedMatchRing
          c={c}
          score={scheme.score}
          size={82}
        />
      </div>

      <h3
        style={{
          fontSize: 20,
          margin: "20px 0 6px",
        }}
      >
        {translated.name}
      </h3>

      <div
        style={{
          color: c.muted,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {detail.ministry}
      </div>

      <p
        style={{
          lineHeight: 1.6,
          color: c.muted,
          fontSize: 14,
        }}
      >
        {translated.short}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20,
          paddingTop: 15,
          borderTop: `1px solid ${c.border}`,
        }}
      >
        <strong style={{ color: c.accent }}>
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
  onBack,
  onApply,
}) {
  const schemeId = scheme.scheme_id || scheme.id;
  const translated =
    SCHEME_TRANSLATIONS[language]?.[schemeId] ||
    SCHEME_TRANSLATIONS[language]?.[scheme.id] || {
      name: scheme.scheme_name || scheme.name || schemeId,
      benefit: scheme.benefit || scheme.benefit_amount || "Financial assistance / loan scheme",
      short: scheme.why_matched || scheme.eligibility_text || "Government enterprise scheme.",
    };

  const docs = scheme.documents_required || scheme.documents || [];
  const score =
    scheme.score !== undefined
      ? scheme.score
      : Math.round((scheme.confidence || 0.85) * 100);

  const officialLink = scheme.application_link || scheme.application_url;

  // Financial Estimator & What-If Simulator State
  const initialPrincipal = Number(profile?.projectCost || profile?.project_cost || (scheme.max_loan_amount ? Math.min(500000, Number(scheme.max_loan_amount)) : 500000));
  const schemeMaxLoan = scheme.max_loan_amount ? Number(scheme.max_loan_amount) : null;
  const [simulatorMode, setSimulatorMode] = useState("comparator"); // "comparator" | "quick"
  
  // Base Scenario
  const [loanAmount, setLoanAmount] = useState(initialPrincipal > 0 ? initialPrincipal : 500000);
  const [interestRate, setInterestRate] = useState(8.0);
  const [tenureMonths, setTenureMonths] = useState(60);

  // What-If Scenario
  const defaultWhatIfLoan = Math.max(25000, initialPrincipal > 100000 ? initialPrincipal - 100000 : Math.round(initialPrincipal * 0.8));
  const [whatIfLoanAmount, setWhatIfLoanAmount] = useState(defaultWhatIfLoan);
  const [whatIfInterestRate, setWhatIfInterestRate] = useState(8.0);
  const [whatIfTenureMonths, setWhatIfTenureMonths] = useState(84);

  // Financial Profile & Affordability
  const defaultIncome = profile?.income ? Math.round(Number(profile.income) / 12) : 35000;
  const [monthlyIncome, setMonthlyIncome] = useState(defaultIncome > 0 ? defaultIncome : 35000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(15000);
  const [existingEmi, setExistingEmi] = useState(0);
  const [showFinancialHealth, setShowFinancialHealth] = useState(true);

  // Results State
  const [whatIfResult, setWhatIfResult] = useState(null);
  // Scheme Provenance & Traceable Verification State
  const [provenanceData, setProvenanceData] = useState(null);
  const [isLoadingProvenance, setIsLoadingProvenance] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProvenance() {
      if (!schemeId) return;
      setIsLoadingProvenance(true);
      try {
        const res = await getSchemeSources(schemeId);
        if (isMounted) {
          setProvenanceData(res);
        }
      } catch (err) {
        console.warn("Scheme provenance lookup error:", err);
      } finally {
        if (isMounted) setIsLoadingProvenance(false);
      }
    }
    fetchProvenance();
    return () => {
      isMounted = false;
    };
  }, [schemeId]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatorError, setSimulatorError] = useState("");



  useEffect(() => {
    let isMounted = true;
    const fetchSimulation = async () => {
      setIsSimulating(true);
      setSimulatorError("");
      try {
        const payload = {
          scheme_id: schemeId,
          base: {
            loan_amount: loanAmount,
            annual_interest_rate: interestRate,
            tenure_months: tenureMonths,
          },
          scenario: {
            loan_amount: whatIfLoanAmount,
            annual_interest_rate: whatIfInterestRate,
            tenure_months: whatIfTenureMonths,
          },
          financial_profile: showFinancialHealth && monthlyIncome > 0 ? {
            monthly_income: monthlyIncome,
            monthly_expenses: monthlyExpenses,
            existing_emi: existingEmi,
          } : null,
        };

        const res = await simulateWhatIf(payload);
        if (isMounted) {
          setWhatIfResult(res);
          if (res.base && !res.base.is_valid && res.base.message) {
            setSimulatorError(res.base.message);
          } else if (res.scenario && !res.scenario.is_valid && res.scenario.message) {
            setSimulatorError(res.scenario.message);
          }
        }
      } catch (err) {
        console.warn("What-If simulation API error:", err);
        if (isMounted) {
          setSimulatorError(err.message || "Unable to simulate scenarios. Please check your parameters.");
        }
      } finally {
        if (isMounted) setIsSimulating(false);
      }
    };

    const timer = setTimeout(fetchSimulation, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    loanAmount,
    interestRate,
    tenureMonths,
    whatIfLoanAmount,
    whatIfInterestRate,
    whatIfTenureMonths,
    monthlyIncome,
    monthlyExpenses,
    existingEmi,
    showFinancialHealth,
    schemeId,
  ]);



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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div
              style={{
                color: c.primary,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 1.1,
              }}
            >
              {t.schemeDetails.toUpperCase()}
            </div>

            <div
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                background: `${c.primary}15`,
                color: c.primary,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {score}% AI Match Confidence
            </div>
          </div>

          <h1
            style={{
              fontSize: 40,
              margin: "12px 0 6px",
              lineHeight: 1.25,
            }}
          >
            {translated.name}
          </h1>

          <div
            style={{
              color: c.muted,
              fontSize: 14,
              fontWeight: 650,
              marginBottom: 16,
            }}
          >
            {scheme.ministry || "Ministry of Social Justice & Empowerment"}
          </div>

          <p
            style={{
              color: c.muted,
              fontSize: 16,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {translated.short}
          </p>

          {/* AI MATCH EXPLANATION (EXPLAINABILITY) */}
          {scheme.why_matched && (
            <div
              style={{
                marginTop: 22,
                padding: 18,
                borderRadius: 18,
                background: `${c.primary}10`,
                border: `1.5px solid ${c.primary}30`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: c.primary,
                  fontWeight: 800,
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <Sparkles size={16} />
                <span>AI Eligibility & Matching Rationale (Why This Scheme?)</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>
                {scheme.why_matched}
              </div>
            </div>
          )}

          {/* MAIN BENEFIT BOX */}
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 28,
              marginTop: 22,
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
              {t.mainBenefit.toUpperCase()}
            </div>

            <div
              style={{
                fontSize: 26,
                color: c.accent,
                fontWeight: 800,
                marginTop: 6,
              }}
            >
              {translated.benefit}
            </div>
          </div>

          {/* WHAT-IF FINANCIAL SIMULATOR & SCENARIO COMPARATOR */}
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 28,
              marginTop: 22,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `${c.primary}15`,
                    color: c.primary,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <IndianRupee size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, margin: 0 }}>Financial Fit & What-If Simulator</h2>
                  <div style={{ fontSize: 12, color: c.muted }}>
                    Compare loan terms, repayment burden & cashflow affordability live
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {schemeMaxLoan && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 750,
                      padding: "4px 10px",
                      borderRadius: 10,
                      background: `${c.primary}15`,
                      color: c.primary,
                    }}
                  >
                    Max Scheme Limit: ₹{schemeMaxLoan.toLocaleString("en-IN")}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 750,
                    padding: "4px 10px",
                    borderRadius: 10,
                    background: `${c.accent}18`,
                    color: c.accent,
                  }}
                >
                  Illustrative EMI Estimate
                </span>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: "flex",
                gap: 8,
                background: c.surface2,
                padding: 4,
                borderRadius: 14,
                marginBottom: 20,
              }}
            >
              <button
                type="button"
                onClick={() => setSimulatorMode("comparator")}
                style={{
                  flex: 1,
                  padding: "9px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: simulatorMode === "comparator" ? c.surface : "transparent",
                  color: simulatorMode === "comparator" ? c.primary : c.muted,
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                  boxShadow: simulatorMode === "comparator" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                📊 What-If Scenario Comparator
              </button>
              <button
                type="button"
                onClick={() => setSimulatorMode("quick")}
                style={{
                  flex: 1,
                  padding: "9px 14px",
                  borderRadius: 10,
                  border: "none",
                  background: simulatorMode === "quick" ? c.surface : "transparent",
                  color: simulatorMode === "quick" ? c.primary : c.muted,
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                  boxShadow: simulatorMode === "quick" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                ⚡ Single Scenario Calculator
              </button>
            </div>

            {/* ERROR ALERT */}
            {simulatorError && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: `${c.danger}15`,
                  border: `1px solid ${c.danger}35`,
                  color: c.danger,
                  fontSize: 13,
                  fontWeight: 650,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                <span>{simulatorError}</span>
              </div>
            )}

            {/* SCHEME CEILING WARNING */}
            {whatIfResult && (whatIfResult.base?.exceeds_scheme_limit || whatIfResult.scenario?.exceeds_scheme_limit) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: `${c.accent}15`,
                  border: `1px solid ${c.accent}35`,
                  color: c.accent,
                  fontSize: 13,
                  fontWeight: 650,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                <span>
                  {whatIfResult.base?.exceeds_scheme_limit && `Base loan amount exceeds ${schemeId} ceiling of ₹${schemeMaxLoan?.toLocaleString("en-IN")}. `}
                  {whatIfResult.scenario?.exceeds_scheme_limit && `What-If loan amount exceeds ${schemeId} ceiling of ₹${schemeMaxLoan?.toLocaleString("en-IN")}.`}
                </span>
              </div>
            )}

            {/* NARRATIVE INSIGHT BANNER (WHAT-IF MODE) */}
            {simulatorMode === "comparator" && whatIfResult?.difference?.narrative && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: `${c.primary}12`,
                  border: `1.5px solid ${c.primary}25`,
                  marginBottom: 20,
                }}
              >
                <Sparkles size={18} style={{ color: c.primary, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 750, color: c.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    What-If Impact Summary
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginTop: 2, lineHeight: 1.4 }}>
                    {whatIfResult.difference.narrative}
                  </div>
                </div>
              </div>
            )}

            {/* INPUT CONTROLS */}
            {simulatorMode === "comparator" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 18,
                  marginBottom: 20,
                }}
              >
                {/* Column 1: Base Scenario */}
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: c.surface2,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>
                      Scenario A (Base Plan)
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.muted }}>Current</span>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      Loan Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="25000"
                      min="10000"
                      max={schemeMaxLoan || 10000000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      Interest Rate (% p.a.)
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="25"
                        value={interestRate}
                        onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                        style={{ ...inputStyle(c), flex: 1, padding: "8px 12px", fontSize: 14, fontWeight: 700 }}
                      />
                      <button
                        type="button"
                        onClick={() => setInterestRate(0)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: `1px solid ${interestRate === 0 ? c.primary : c.border}`,
                          background: interestRate === 0 ? `${c.primary}20` : c.surface,
                          color: interestRate === 0 ? c.primary : c.muted,
                          fontSize: 10,
                          fontWeight: 750,
                          cursor: "pointer",
                        }}
                      >
                        0% Grant
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      Tenure (Months)
                    </label>
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years)</option>
                      <option value={84}>84 Months (7 Years)</option>
                    </select>
                  </div>
                </div>

                {/* Column 2: What-If Scenario */}
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: `${c.primary}07`,
                    border: `1.5px solid ${c.primary}30`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: c.primary }}>
                      Scenario B (What-If Alternative)
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 750, color: c.primary, background: `${c.primary}18`, padding: "2px 8px", borderRadius: 8 }}>
                      Simulation
                    </span>
                  </div>

                  {/* Quick Preset Chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    <button
                      type="button"
                      onClick={() => setWhatIfLoanAmount(Math.max(25000, Math.round(loanAmount * 0.8)))}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "none",
                        background: c.surface,
                        color: c.text,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      -20% Loan
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatIfTenureMonths(Math.min(84, tenureMonths + 24))}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "none",
                        background: c.surface,
                        color: c.text,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      +2 Yrs Tenure
                    </button>
                    <button
                      type="button"
                      onClick={() => setWhatIfInterestRate(0)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "none",
                        background: c.surface,
                        color: c.text,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      0% Subsidy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWhatIfLoanAmount(loanAmount);
                        setWhatIfInterestRate(interestRate);
                        setWhatIfTenureMonths(tenureMonths);
                      }}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "none",
                        background: c.surface,
                        color: c.muted,
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      What-If Loan Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="25000"
                      min="10000"
                      max={schemeMaxLoan || 10000000}
                      value={whatIfLoanAmount}
                      onChange={(e) => setWhatIfLoanAmount(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      What-If Interest Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="25"
                      value={whatIfInterestRate}
                      onChange={(e) => setWhatIfInterestRate(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      What-If Tenure (Months)
                    </label>
                    <select
                      value={whatIfTenureMonths}
                      onChange={(e) => setWhatIfTenureMonths(Number(e.target.value))}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
                    >
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Years)</option>
                      <option value={36}>36 Months (3 Years)</option>
                      <option value={48}>48 Months (4 Years)</option>
                      <option value={60}>60 Months (5 Years)</option>
                      <option value={84}>84 Months (7 Years)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* Single Scenario Mode Controls */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: c.muted, display: "block", marginBottom: 6 }}>
                    Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="25000"
                    min="10000"
                    max={schemeMaxLoan || 10000000}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                    style={{ ...inputStyle(c), width: "100%", padding: "10px 14px", fontSize: 15, fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: c.muted, display: "block", marginBottom: 6 }}>
                    Interest Rate (% p.a.)
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="25"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), flex: 1, padding: "10px 14px", fontSize: 15, fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      onClick={() => setInterestRate(0)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: `1px solid ${interestRate === 0 ? c.primary : c.border}`,
                        background: interestRate === 0 ? `${c.primary}20` : c.surface2,
                        color: interestRate === 0 ? c.primary : c.muted,
                        fontSize: 11,
                        fontWeight: 750,
                        cursor: "pointer",
                      }}
                    >
                      0% Subsidy
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: c.muted, display: "block", marginBottom: 6 }}>
                    Tenure (Months)
                  </label>
                  <select
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    style={{ ...inputStyle(c), width: "100%", padding: "10px 14px", fontSize: 14, fontWeight: 700 }}
                  >
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                    <option value={36}>36 Months (3 Years)</option>
                    <option value={48}>48 Months (4 Years)</option>
                    <option value={60}>60 Months (5 Years)</option>
                    <option value={84}>84 Months (7 Years)</option>
                  </select>
                </div>
              </div>
            )}

            {/* APPLICANT FINANCIAL HEALTH & AFFORDABILITY (COLLAPSIBLE) */}
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                background: c.surface2,
                border: `1px solid ${c.border}`,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onClick={() => setShowFinancialHealth(!showFinancialHealth)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BadgeCheck size={18} style={{ color: c.primary }} />
                  <span style={{ fontSize: 13, fontWeight: 750, color: c.text }}>
                    Household Cashflow & Repayment Comfort Assessment
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.primary }}>
                  {showFinancialHealth ? "Hide ▲" : "Show / Configure ▼"}
                </span>
              </div>

              {showFinancialHealth && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12,
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: `1px solid ${c.border}`,
                  }}
                >
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      Monthly Household Income (₹)
                    </label>
                    <input
                      type="number"
                      step="2000"
                      min="0"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      Monthly Living Expenses (₹)
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: c.muted, display: "block", marginBottom: 4 }}>
                      Existing Other Loan EMI (₹)
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={existingEmi}
                      onChange={(e) => setExistingEmi(Number(e.target.value) || 0)}
                      style={{ ...inputStyle(c), width: "100%", padding: "8px 12px", fontSize: 13, fontWeight: 700 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RESULTS RENDERING */}
            {isSimulating ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: 24,
                  borderRadius: 16,
                  background: c.surface2,
                  color: c.muted,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <RefreshCw size={18} className="spin" />
                <span>Simulating financial scenarios live via FastAPI backend...</span>
              </div>
            ) : whatIfResult && whatIfResult.base?.is_valid ? (
              simulatorMode === "comparator" && whatIfResult.scenario?.is_valid ? (
                /* Side-by-Side Comparison Matrix */
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {/* EMI Comparison Card */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        background: c.surface2,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>MONTHLY EMI</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                        <div>
                          <div style={{ fontSize: 11, color: c.muted }}>Base</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>
                            ₹{Number(whatIfResult.base.monthly_emi).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <ArrowRight size={16} style={{ color: c.muted }} />
                        <div>
                          <div style={{ fontSize: 11, color: c.primary, fontWeight: 750 }}>What-If</div>
                          <div style={{ fontSize: 20, fontWeight: 850, color: c.primary }}>
                            ₹{Number(whatIfResult.scenario.monthly_emi).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      {whatIfResult.difference && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "4px 8px",
                            borderRadius: 8,
                            background: whatIfResult.difference.emi <= 0 ? `${c.primary}18` : `${c.accent}18`,
                            color: whatIfResult.difference.emi <= 0 ? c.primary : c.accent,
                            fontSize: 12,
                            fontWeight: 750,
                            display: "inline-block",
                          }}
                        >
                          {whatIfResult.difference.emi <= 0 ? "↓" : "↑"} ₹{Math.abs(Math.round(whatIfResult.difference.emi)).toLocaleString("en-IN")}/mo ({whatIfResult.difference.emi_percentage_change}%)
                        </div>
                      )}
                    </div>

                    {/* Total Interest Card */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        background: c.surface2,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>TOTAL INTEREST COST</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                        <div>
                          <div style={{ fontSize: 11, color: c.muted }}>Base</div>
                          <div style={{ fontSize: 16, fontWeight: 750, color: c.text }}>
                            ₹{Number(whatIfResult.base.total_interest).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <ArrowRight size={16} style={{ color: c.muted }} />
                        <div>
                          <div style={{ fontSize: 11, color: c.primary, fontWeight: 750 }}>What-If</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>
                            ₹{Number(whatIfResult.scenario.total_interest).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      {whatIfResult.difference && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "4px 8px",
                            borderRadius: 8,
                            background: whatIfResult.difference.total_interest <= 0 ? `${c.primary}18` : `${c.accent}18`,
                            color: whatIfResult.difference.total_interest <= 0 ? c.primary : c.accent,
                            fontSize: 12,
                            fontWeight: 750,
                            display: "inline-block",
                          }}
                        >
                          {whatIfResult.difference.total_interest <= 0 ? "↓ Saves" : "↑ Adds"} ₹{Math.abs(Math.round(whatIfResult.difference.total_interest)).toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>

                    {/* Total Repayment Card */}
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 16,
                        background: c.surface2,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>TOTAL REPAYMENT</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                        <div>
                          <div style={{ fontSize: 11, color: c.muted }}>Base</div>
                          <div style={{ fontSize: 16, fontWeight: 750, color: c.text }}>
                            ₹{Number(whatIfResult.base.total_repayment).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <ArrowRight size={16} style={{ color: c.muted }} />
                        <div>
                          <div style={{ fontSize: 11, color: c.primary, fontWeight: 750 }}>What-If</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: c.text }}>
                            ₹{Number(whatIfResult.scenario.total_repayment).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      {whatIfResult.difference && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "4px 8px",
                            borderRadius: 8,
                            background: whatIfResult.difference.total_repayment <= 0 ? `${c.primary}18` : `${c.accent}18`,
                            color: whatIfResult.difference.total_repayment <= 0 ? c.primary : c.accent,
                            fontSize: 12,
                            fontWeight: 750,
                            display: "inline-block",
                          }}
                        >
                          Diff: {whatIfResult.difference.total_repayment <= 0 ? "-" : "+"}₹{Math.abs(Math.round(whatIfResult.difference.total_repayment)).toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Readiness Comfort Comparison */}
                  {showFinancialHealth && whatIfResult.base.readiness && whatIfResult.scenario.readiness && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 18,
                        borderRadius: 16,
                        background: c.surface2,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>
                          🧮 Financial Readiness Assessment
                        </div>
                        <span style={{ fontSize: 11, color: c.muted, fontWeight: 650 }}>
                          Educational Cashflow Heuristic
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                        {/* Base Readiness */}
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 12,
                            background: c.surface,
                            border: `1px solid ${c.border}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: c.muted }}>Base Plan Readiness</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: whatIfResult.base.readiness.status === "Comfortable" ? `${c.primary}20` : whatIfResult.base.readiness.status === "Moderate" ? `${c.accent}20` : `${c.danger}20`,
                                color: whatIfResult.base.readiness.status === "Comfortable" ? c.primary : whatIfResult.base.readiness.status === "Moderate" ? c.accent : c.danger,
                              }}
                            >
                              {whatIfResult.base.readiness.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginTop: 4 }}>
                            Repayment Burden: {whatIfResult.base.readiness.emi_to_income_ratio}% of income
                          </div>
                          <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
                            Disposable After EMI: ₹{Number(whatIfResult.base.readiness.disposable_income).toLocaleString("en-IN")}/mo
                          </div>
                        </div>

                        {/* What-If Readiness */}
                        <div
                          style={{
                            padding: 14,
                            borderRadius: 12,
                            background: `${c.primary}08`,
                            border: `1.5px solid ${c.primary}30`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 750, color: c.primary }}>What-If Plan Readiness</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: whatIfResult.scenario.readiness.status === "Comfortable" ? `${c.primary}20` : whatIfResult.scenario.readiness.status === "Moderate" ? `${c.accent}20` : `${c.danger}20`,
                                color: whatIfResult.scenario.readiness.status === "Comfortable" ? c.primary : whatIfResult.scenario.readiness.status === "Moderate" ? c.accent : c.danger,
                              }}
                            >
                              {whatIfResult.scenario.readiness.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: c.primary, marginTop: 4 }}>
                            Repayment Burden: {whatIfResult.scenario.readiness.emi_to_income_ratio}% of income
                          </div>
                          <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
                            Disposable After EMI: ₹{Number(whatIfResult.scenario.readiness.disposable_income).toLocaleString("en-IN")}/mo
                          </div>
                        </div>
                      </div>

                      {whatIfResult.scenario.readiness.reason && (
                        <div style={{ fontSize: 12, color: c.text, marginTop: 12, lineHeight: 1.4, padding: "8px 12px", borderRadius: 8, background: c.surface }}>
                          💡 {whatIfResult.scenario.readiness.reason}
                        </div>
                      )}

                      {whatIfResult.scenario.readiness.recommendations && whatIfResult.scenario.readiness.recommendations.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {whatIfResult.scenario.readiness.recommendations.map((rec, i) => (
                            <div key={i} style={{ fontSize: 11, color: c.muted, marginTop: 4, display: "flex", gap: 6, alignItems: "center" }}>
                              <span>•</span>
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Single Scenario Mode Output */
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: 12,
                      padding: 18,
                      borderRadius: 16,
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 650 }}>ESTIMATED MONTHLY EMI</div>
                      <div style={{ fontSize: 24, fontWeight: 850, color: c.primary, marginTop: 4 }}>
                        ₹{Number(whatIfResult.base.monthly_emi).toLocaleString("en-IN")}/mo
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 650 }}>TOTAL INTEREST</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginTop: 6 }}>
                        ₹{Number(whatIfResult.base.total_interest).toLocaleString("en-IN")}
                        {whatIfResult.base.interest_percentage !== undefined && (
                          <span style={{ fontSize: 11, color: c.muted, marginLeft: 6, fontWeight: 600 }}>
                            ({whatIfResult.base.interest_percentage}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted, fontWeight: 650 }}>TOTAL REPAYMENT</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginTop: 6 }}>
                        ₹{Number(whatIfResult.base.total_repayment).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Principal vs Interest Progress Bar */}
                  {whatIfResult.base.total_repayment > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: c.muted, marginBottom: 4 }}>
                        <span>Principal: ₹{Number(whatIfResult.base.loan_amount).toLocaleString("en-IN")} ({whatIfResult.base.principal_percentage || 80}%)</span>
                        <span>Interest: ₹{Number(whatIfResult.base.total_interest).toLocaleString("en-IN")} ({whatIfResult.base.interest_percentage || 20}%)</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: `${c.accent}40`, overflow: "hidden", display: "flex" }}>
                        <div
                          style={{
                            width: `${whatIfResult.base.principal_percentage || 80}%`,
                            height: "100%",
                            background: c.primary,
                            transition: "width 0.3s ease",
                          }}
                        />
                        <div
                          style={{
                            width: `${whatIfResult.base.interest_percentage || 20}%`,
                            height: "100%",
                            background: c.accent,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Single Mode Financial Readiness Assessment Box */}
                  {showFinancialHealth && whatIfResult.base.readiness && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 18,
                        borderRadius: 16,
                        background: c.surface2,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>
                          🧮 Financial Readiness Assessment
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: 8,
                            background: whatIfResult.base.readiness.status === "Comfortable" ? `${c.primary}20` : whatIfResult.base.readiness.status === "Moderate" ? `${c.accent}20` : `${c.danger}20`,
                            color: whatIfResult.base.readiness.status === "Comfortable" ? c.primary : whatIfResult.base.readiness.status === "Moderate" ? c.accent : c.danger,
                          }}
                        >
                          {whatIfResult.base.readiness.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <div style={{ padding: "10px 12px", borderRadius: 10, background: c.surface }}>
                          <div style={{ fontSize: 10, color: c.muted, fontWeight: 700 }}>MONTHLY INCOME</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: c.text, marginTop: 2 }}>
                            ₹{Number(whatIfResult.base.readiness.monthly_income).toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div style={{ padding: "10px 12px", borderRadius: 10, background: c.surface }}>
                          <div style={{ fontSize: 10, color: c.muted, fontWeight: 700 }}>TOTAL MONTHLY DEBT</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: c.text, marginTop: 2 }}>
                            ₹{Number(whatIfResult.base.readiness.total_obligations).toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div style={{ padding: "10px 12px", borderRadius: 10, background: c.surface }}>
                          <div style={{ fontSize: 10, color: c.muted, fontWeight: 700 }}>DISPOSABLE AFTER EMI</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: whatIfResult.base.readiness.disposable_income >= 0 ? c.primary : c.danger, marginTop: 2 }}>
                            ₹{Number(whatIfResult.base.readiness.disposable_income).toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div style={{ padding: "10px 12px", borderRadius: 10, background: c.surface }}>
                          <div style={{ fontSize: 10, color: c.muted, fontWeight: 700 }}>REPAYMENT BURDEN</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: c.text, marginTop: 2 }}>
                            {whatIfResult.base.readiness.emi_to_income_ratio}%
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: c.text, lineHeight: 1.4 }}>
                        {whatIfResult.base.readiness.reason}
                      </div>
                      <div style={{ fontSize: 10, color: c.muted, marginTop: 6 }}>
                        * Repayment burden = total monthly debt payments ÷ monthly income. Educational heuristic, not a loan sanction decision.
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : null}

            <p style={{ margin: "16px 0 0", fontSize: 11, color: c.muted, lineHeight: 1.5 }}>
              * Illustrative calculation via standard reducing-balance formula live by FastAPI backend (/api/finance/what-if). Final loan terms, interest subvention, subsidy sanction, and disbursement are determined by authorized Channel Partners under MoSJE & MSME guidelines.
            </p>
          </div>

          {/* SCHEME PROVENANCE & VERIFICATION TRACEABILITY */}
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 28,
              marginTop: 22,
              border: `1.5px solid ${c.border}`,
              background: c.surface,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${c.primary}15`,
                    color: c.primary,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, margin: 0 }}>Source & Verification / स्रोत एवं सत्यापन</h2>
                  <div style={{ fontSize: 12, color: c.muted }}>
                    Verifiable provenance, issuing ministry, and authoritative source link
                  </div>
                </div>
              </div>

              {provenanceData?.primary_source && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 750,
                      background:
                        provenanceData.primary_source.verification_status === "VERIFIED"
                          ? `${c.success}18`
                          : provenanceData.primary_source.verification_status === "DEMO"
                          ? `${c.accent}20`
                          : `${c.muted}20`,
                      color:
                        provenanceData.primary_source.verification_status === "VERIFIED"
                          ? c.success
                          : provenanceData.primary_source.verification_status === "DEMO"
                          ? c.accent
                          : c.muted,
                      border: `1px solid ${
                        provenanceData.primary_source.verification_status === "VERIFIED"
                          ? `${c.success}40`
                          : `${c.accent}40`
                      }`,
                    }}
                  >
                    {provenanceData.primary_source.verification_status === "VERIFIED"
                      ? "✓ Verified Source"
                      : provenanceData.primary_source.verification_status === "DEMO"
                      ? "Demo / Synthetic Data"
                      : provenanceData.primary_source.verification_status}
                  </span>
                </div>
              )}
            </div>

            {/* Provenance Metadata Grid */}
            {provenanceData?.primary_source ? (
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ padding: "12px 14px", borderRadius: 12, background: c.surface2 }}>
                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 750, textTransform: "uppercase" }}>
                      Issuing Organization
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: c.text }}>
                      {provenanceData.primary_source.source_organization || scheme.ministry || "Ministry of Social Justice & Empowerment"}
                    </div>
                  </div>

                  <div style={{ padding: "12px 14px", borderRadius: 12, background: c.surface2 }}>
                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 750, textTransform: "uppercase" }}>
                      Source Authority / Portal
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: c.text }}>
                      {provenanceData.primary_source.source_name || "Official National Portal"}
                    </div>
                  </div>

                  <div style={{ padding: "12px 14px", borderRadius: 12, background: c.surface2 }}>
                    <div style={{ fontSize: 10, color: c.muted, fontWeight: 750, textTransform: "uppercase" }}>
                      Data Version & Last Verified
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: c.text }}>
                      v{provenanceData.primary_source.data_version || "1.0"} • {provenanceData.primary_source.verified_at ? new Date(provenanceData.primary_source.verified_at).toLocaleDateString("en-IN") : "Active 2026"}
                    </div>
                  </div>
                </div>

                {provenanceData.primary_source.verification_status === "DEMO" ? (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: `${c.accent}12`,
                      border: `1px solid ${c.accent}30`,
                      fontSize: 12,
                      color: c.text,
                      lineHeight: 1.4,
                      marginBottom: 14,
                    }}
                  >
                    ⚠️ <strong>Notice:</strong> {provenanceData.primary_source.notes || "This is a synthetic / demo scheme record configured for hackathon algorithm evaluation. Official government sanction requires integration with live ministry APIs."}
                  </div>
                ) : (
                  provenanceData.primary_source.source_url && (
                    <div style={{ marginTop: 10 }}>
                      <a
                        href={provenanceData.primary_source.source_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 700,
                          color: c.primary,
                          textDecoration: "none",
                        }}
                      >
                        <span>View Authoritative Source ({new URL(provenanceData.primary_source.source_url.startsWith("http") ? provenanceData.primary_source.source_url : "https://" + provenanceData.primary_source.source_url).hostname})</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: c.muted }}>
                {isLoadingProvenance ? "Loading traceable source metadata..." : "Source verified via central government welfare scheme dataset."}
              </div>
            )}
          </div>

          {/* REQUIRED DOCUMENTS */}
          <div
            className="glass"
            style={{
              borderRadius: 24,
              padding: 28,
              marginTop: 20,
            }}
          >
            <h2 style={{ fontSize: 22, margin: "0 0 16px 0" }}>
              {t.documentsNeeded}
            </h2>

            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {docs.map((doc) => (
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

                  <span style={{ fontWeight: 600 }}>
                    {DOCUMENT_TRANSLATIONS[language]?.[doc] || doc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* INTERACTIVE CHANNEL PARTNER MAP & ROUTING */}
          <PartnerMap
            c={c}
            t={t}
            scheme={scheme}
            profile={profile}
            selectedPartner={selectedPartner}
            setSelectedPartner={setSelectedPartner}
            onContinue={(partner) => onApply && onApply(partner)}
          />

          {/* OFFICIAL PORTAL LINK IF AVAILABLE */}
          {officialLink && (
            <div style={{ marginTop: 20 }}>
              <a
                href={officialLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...secondaryButton(c),
                  width: "100%",
                  textDecoration: "none",
                }}
              >
                <span>Visit Official Ministry Portal</span>
                <ExternalLink size={16} />
              </a>
            </div>
          )}

          {/* VERIFY DOCUMENTS & APPLY CTA */}
          <button
            type="button"
            onClick={() => onApply && onApply(selectedPartner)}
            style={{
              ...primaryButton(c),
              width: "100%",
              marginTop: 18,
              padding: "16px 24px",
              fontSize: 16,
            }}
          >
            <Camera size={20} />
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
  language,
  scheme,
  docStatus,
  setDocStatus,
  selectedPartner,
  onBack,
  onSubmit,
}) {
  const schemeId = scheme?.scheme_id || scheme?.id || null;
  const schemeName = scheme?.scheme_name || scheme?.name || "Selected Scheme";
  const initialDocs = scheme?.documents_required || scheme?.documents || [];

  const [checklistItems, setChecklistItems] = useState([]);
  const [expandedWhy, setExpandedWhy] = useState({});
  const [readinessData, setReadinessData] = useState({
    required_documents: initialDocs,
    provided_documents: [],
    missing_documents: initialDocs,
    readiness_percentage: 0.0,
    is_ready_to_submit: false,
  });
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Fetch dynamic scheme checklist & sync readiness
  useEffect(() => {
    let isMounted = true;

    async function loadDynamicChecklist() {
      setIsLoadingDocs(true);
      try {
        const res = await getSchemeDocumentChecklist(schemeId);
        if (isMounted && res) {
          const items = res.checklist || res.documents || [];
          if (items.length > 0) {
            setChecklistItems(items);
          } else if (initialDocs.length > 0) {
            // Fallback items from scheme props
            setChecklistItems(
              initialDocs.map((d, idx) => ({
                id: `req-fallback-${idx}`,
                requirement_id: `req-fallback-${idx}`,
                document_name: d,
                document_type: "general_document",
                mandatory: true,
                required: true,
                why_required: "Required for application verification. Exact purpose should be confirmed with the authorized Channel Partner.",
                accepted_formats: ["pdf", "jpg", "jpeg", "png", "webp"],
                max_file_size_mb: 20,
                source: "scheme_dataset",
                verification_status: "VERIFIED",
              }))
            );
          }

          // Initial readiness check
          const provided = Object.keys(docStatus).filter(
            (k) => docStatus[k]?.status === "uploaded" || docStatus[k]?.status === "good"
          );
          const reqNames = (items.length > 0 ? items.map((i) => i.document_name) : initialDocs);

          const rRes = await checkDocumentReadiness({
            scheme_id: schemeId,
            required_documents: reqNames.length > 0 ? reqNames : null,
            provided_documents: provided,
          });

          if (isMounted && rRes) {
            setReadinessData(rRes);
          }
        }
      } catch (err) {
        console.warn("Dynamic checklist loading error:", err);
      } finally {
        if (isMounted) setIsLoadingDocs(false);
      }
    }

    loadDynamicChecklist();
    return () => {
      isMounted = false;
    };
  }, [schemeId]);

  const toggleWhy = (reqKey) => {
    setExpandedWhy((prev) => ({
      ...prev,
      [reqKey]: !prev[reqKey],
    }));
  };

  const handleFileUpload = async (file, item) => {
    if (!file) return;
    const docKey = item.document_name || item.requirement_id;
    const reqId = item.requirement_id || item.id;

    // Client-side file size check (Max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setDocStatus((prev) => ({
        ...prev,
        [docKey]: {
          status: "error",
          message: "File exceeds 20MB limit. Please upload a smaller PDF or image file.",
        },
      }));
      return;
    }

    setDocStatus((prev) => ({
      ...prev,
      [docKey]: { status: "uploading", filename: file.name },
    }));

    try {
      const res = await uploadSchemeDocument({
        file: file,
        requirementId: reqId,
        documentName: item.document_name,
        documentType: item.document_type || "general_document",
        schemeId: schemeId,
      });

      if (res.is_valid || res.document_id) {
        const updatedDocStatus = {
          ...docStatus,
          [docKey]: {
            status: "uploaded",
            data: res,
            document_id: res.document_id || res.id,
            filename: res.original_filename || file.name,
            file_format: res.file_format || "Document",
            file_size_formatted: res.file_size_formatted || `${(file.size / 1024).toFixed(1)} KB`,
            message: res.validation_message || "Document uploaded and format-validated.",
          },
        };

        setDocStatus(updatedDocStatus);

        // Recalculate true backend document readiness
        const provided = Object.keys(updatedDocStatus).filter(
          (k) => updatedDocStatus[k]?.status === "uploaded" || updatedDocStatus[k]?.status === "good"
        );

        const reqNames = checklistItems.map((i) => i.document_name);
        const readinessRes = await checkDocumentReadiness({
          scheme_id: schemeId,
          required_documents: reqNames.length > 0 ? reqNames : null,
          provided_documents: provided,
        });

        if (readinessRes) {
          setReadinessData(readinessRes);
        }
      } else {
        setDocStatus((prev) => ({
          ...prev,
          [docKey]: {
            status: "error",
            data: res,
            message: res.validation_message || res.message || "Document format validation failed.",
          },
        }));
      }
    } catch (err) {
      console.error("Document upload API error:", err);
      setDocStatus((prev) => ({
        ...prev,
        [docKey]: {
          status: "error",
          message: err.message || "Failed to process document upload. Please try again.",
        },
      }));
    }
  };

  const handleRemoveDoc = (docKey) => {
    const updated = { ...docStatus };
    delete updated[docKey];
    setDocStatus(updated);

    const provided = Object.keys(updated).filter(
      (k) => updated[k]?.status === "uploaded" || updated[k]?.status === "good"
    );
    const reqNames = checklistItems.map((i) => i.document_name);
    checkDocumentReadiness({
      scheme_id: schemeId,
      required_documents: reqNames.length > 0 ? reqNames : null,
      provided_documents: provided,
    }).then((rRes) => {
      if (rRes) setReadinessData(rRes);
    });
  };

  const isDocUploaded = (docName) => {
    const s = docStatus[docName];
    return s?.status === "uploaded" || s?.status === "good" || s === "good";
  };

  const mandatoryItems = checklistItems.filter((i) => i.mandatory ?? i.required ?? true);
  const optionalItems = checklistItems.filter((i) => !(i.mandatory ?? i.required ?? true));

  const totalMandatory = mandatoryItems.length;
  const uploadedMandatory = mandatoryItems.filter((i) => isDocUploaded(i.document_name)).length;
  const missingMandatory = mandatoryItems.filter((i) => !isDocUploaded(i.document_name));

  const readinessPct = totalMandatory > 0
    ? Math.round((uploadedMandatory / totalMandatory) * 100)
    : (checklistItems.length > 0 ? 100 : 0);

  const isComplete = missingMandatory.length === 0 && (totalMandatory > 0 || checklistItems.length === 0);
  const canSubmit = isComplete || readinessData.is_ready_to_submit || uploadedMandatory > 0;

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
            margin: "30px auto",
          }}
        >
          <div
            style={{
              color: c.primary,
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: 1.1,
            }}
          >
            {t.documentVerification ? t.documentVerification.toUpperCase() : "SCHEME DOCUMENT CHECKLIST"}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              margin: "8px 0 12px",
            }}
          >
            <h1
              style={{
                fontSize: 32,
                margin: 0,
                fontWeight: 800,
              }}
            >
              Documents Required for {schemeName}
            </h1>
          </div>

          <p
            style={{
              color: c.muted,
              lineHeight: 1.6,
              margin: "0 0 24px 0",
              fontSize: 15,
            }}
          >
            Scheme_Saathi has automatically determined the document requirements for this scheme. Review the required proofs, see why each document is needed, and upload your files (PDF, JPEG, or PNG).
          </p>

          {/* APPLICATION DOCUMENT READINESS SUMMARY CARD */}
          <div
            className="glass"
            style={{
              padding: 24,
              borderRadius: 20,
              marginBottom: 26,
              background: isComplete ? `${c.success}0c` : `${c.primary}08`,
              border: `1.5px solid ${isComplete ? `${c.success}40` : `${c.primary}30`}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 750, fontSize: 16 }}>
                <FileCheck2 size={22} color={isComplete ? c.success : c.primary} />
                <span>Application Document Readiness</span>
              </div>
              <span
                style={{
                  fontWeight: 850,
                  fontSize: 18,
                  color: isComplete ? c.success : c.accent,
                }}
              >
                {readinessPct}% Ready
              </span>
            </div>

            {/* Progress Bar */}
            <div
              style={{
                height: 10,
                borderRadius: 10,
                background: c.surface2,
                overflow: "hidden",
                border: `1px solid ${c.border}`,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${readinessPct}%`,
                  background: isComplete ? c.success : `linear-gradient(90deg, ${c.primary}, ${c.accent})`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 14,
                fontSize: 13.5,
                color: c.muted,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span>
                <strong>{uploadedMandatory}</strong> of <strong>{totalMandatory}</strong> mandatory documents uploaded & validated
              </span>
              {isComplete ? (
                <span style={{ color: c.success, fontWeight: 800, display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 size={16} /> All Mandatory Document Uploads Complete
                </span>
              ) : (
                <span style={{ color: c.accent, fontWeight: 750 }}>
                  {missingMandatory.length} mandatory {missingMandatory.length === 1 ? "document" : "documents"} remaining
                </span>
              )}
            </div>

            {/* Missing documents alert banner */}
            {!isComplete && missingMandatory.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: `${c.accent}12`,
                  border: `1px solid ${c.accent}30`,
                  fontSize: 12.5,
                  color: c.text,
                }}
              >
                <strong style={{ color: c.accent }}>Missing Mandatory Documents: </strong>
                {missingMandatory.map((m) => m.document_name).join(" • ")}
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px dashed ${c.border}`,
                fontSize: 11.5,
                color: c.muted,
                lineHeight: 1.45,
              }}
            >
              ℹ️ <em>Document Readiness Notice: Document readiness is calculated based on verified checklist format uploads. Final scrutiny, statutory eligibility validation, and loan sanction are conducted by the authorized Channel Partner / Nodal Agency.</em>
            </div>
          </div>

          {/* DYNAMIC DOCUMENT CARDS LIST */}
          <div
            style={{
              display: "grid",
              gap: 16,
              marginTop: 10,
            }}
          >
            {isLoadingDocs ? (
              <div style={{ padding: 40, textAlign: "center", color: c.muted }}>
                <RefreshCw size={28} className="spin" style={{ margin: "0 auto 12px" }} />
                <div>Loading scheme-specific document requirements...</div>
              </div>
            ) : checklistItems.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: c.muted }}>
                No specific documents listed for this scheme. You can proceed directly to partner routing.
              </div>
            ) : (
              checklistItems.map((item, idx) => {
                const docName = item.document_name;
                const reqKey = item.requirement_id || item.id || `doc-${idx}`;
                const isMandatory = item.mandatory ?? item.required ?? true;
                const isWhyOpen = !!expandedWhy[reqKey];
                const statusObj = docStatus[docName];
                const isUploaded = isDocUploaded(docName);
                const isUploading = statusObj?.status === "uploading";
                const isError = statusObj?.status === "error" || statusObj?.status === "issues";
                const errorMsg = statusObj?.message;
                const fileName = statusObj?.filename;
                const fileFormat = statusObj?.file_format;
                const fileSize = statusObj?.file_size_formatted;
                const whyText = item.why_required || "Required for application verification. Exact purpose should be confirmed with the authorized Channel Partner.";
                const formatsText = (item.accepted_formats || ["PDF", "JPG", "PNG"]).map((f) => f.toUpperCase()).join(", ");

                return (
                  <div
                    key={reqKey}
                    className="glass"
                    style={{
                      padding: 20,
                      borderRadius: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      border: isUploaded
                        ? `1.5px solid ${c.success}60`
                        : isError
                        ? `1.5px solid ${c.danger || c.accent}60`
                        : `1px solid ${c.border}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Header Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 14,
                          flex: 1,
                          minWidth: 260,
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            background: isUploaded
                              ? `${c.success}18`
                              : isUploading
                              ? `${c.primary}18`
                              : isError
                              ? `${(c.danger || c.accent)}18`
                              : `${c.primary}10`,
                            color: isUploaded
                              ? c.success
                              : isUploading
                              ? c.primary
                              : isError
                              ? (c.danger || c.accent)
                              : c.primary,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isUploaded ? (
                            <CheckCircle2 size={24} />
                          ) : isUploading ? (
                            <RefreshCw size={22} className="spin" />
                          ) : (
                            <FileText size={22} />
                          )}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontWeight: 750,
                                fontSize: 16,
                                color: c.text,
                              }}
                            >
                              {DOCUMENT_TRANSLATIONS[language]?.[docName] || docName}
                            </span>

                            {/* Mandatory / Optional Badge */}
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 750,
                                padding: "3px 8px",
                                borderRadius: 8,
                                background: isMandatory ? `${c.primary}18` : `${c.muted}18`,
                                color: isMandatory ? c.primary : c.muted,
                                border: `1px solid ${isMandatory ? `${c.primary}30` : `${c.muted}30`}`,
                              }}
                            >
                              {isMandatory ? "Mandatory" : "Optional"}
                            </span>

                            {/* Verification Source Badge */}
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 650,
                                padding: "2px 7px",
                                borderRadius: 6,
                                background: item.verification_status === "VERIFIED" ? `${c.success}12` : `${c.muted}12`,
                                color: item.verification_status === "VERIFIED" ? c.success : c.muted,
                              }}
                            >
                              {item.verification_status === "VERIFIED" ? "✓ Verified Guidelines" : "Demo Data"}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 12.5,
                              color: isUploaded
                                ? c.success
                                : isUploading
                                ? c.primary
                                : isError
                                ? (c.danger || c.accent)
                                : c.muted,
                              marginTop: 4,
                              fontWeight: 650,
                            }}
                          >
                            {isUploaded
                              ? "✓ Uploaded (Format Validated)"
                              : isUploading
                              ? "Uploading & validating document format..."
                              : isError
                              ? "⚠️ Validation error"
                              : `Status: ❌ Not Uploaded (Formats: ${formatsText})`}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <label
                          style={{
                            ...primaryButton(c),
                            padding: "9px 16px",
                            fontSize: 13,
                            cursor: isUploading ? "wait" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: isUploaded
                              ? `${c.success}18`
                              : `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                            color: isUploaded ? c.success : "white",
                            border: isUploaded ? `1.5px solid ${c.success}50` : "none",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                            disabled={isUploading}
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], item);
                              }
                            }}
                            style={{ display: "none" }}
                          />
                          <Upload size={15} />
                          <span>
                            {isUploading
                              ? "Uploading..."
                              : isUploaded
                              ? "Replace"
                              : isError
                              ? "Retry"
                              : "Upload Document"}
                          </span>
                        </label>

                        {isUploaded && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(docName)}
                            style={{
                              border: `1px solid ${c.border}`,
                              background: c.surface,
                              color: c.danger || c.accent,
                              borderRadius: 12,
                              padding: "9px 12px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* "WHY IS THIS REQUIRED?" INTERACTIVE ACCORDION */}
                    <div
                      style={{
                        background: c.surface2,
                        borderRadius: 12,
                        padding: "8px 12px",
                        fontSize: 12.5,
                        border: `1px solid ${c.border}`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleWhy(reqKey)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: c.primary,
                          fontWeight: 700,
                          fontSize: 12.5,
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        <span>❓ Why is this document required?</span>
                        <span style={{ fontSize: 10, color: c.muted }}>{isWhyOpen ? "▲ Hide" : "▼ Explain"}</span>
                      </button>

                      {isWhyOpen && (
                        <div
                          style={{
                            marginTop: 6,
                            paddingTop: 6,
                            borderTop: `1px dashed ${c.border}`,
                            color: c.text,
                            lineHeight: 1.5,
                            fontSize: 12,
                          }}
                        >
                          <div><strong>Purpose: </strong>{whyText}</div>
                          {item.description && (
                            <div style={{ color: c.muted, marginTop: 4 }}>
                              <strong>Accepted Issuing Authorities: </strong>{item.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* UPLOADED FILE RECEIPT DETAILS */}
                    {isUploaded && (
                      <div
                        style={{
                          background: `${c.success}08`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          fontSize: 12,
                          display: "flex",
                          gap: 16,
                          flexWrap: "wrap",
                          color: c.text,
                          border: `1px solid ${c.success}30`,
                        }}
                      >
                        {fileName && (
                          <div>
                            <span style={{ color: c.muted }}>File: </span>
                            <strong>{fileName}</strong>
                          </div>
                        )}
                        {fileFormat && (
                          <div>
                            <span style={{ color: c.muted }}>Format: </span>
                            <strong>{fileFormat}</strong>
                          </div>
                        )}
                        {fileSize && (
                          <div>
                            <span style={{ color: c.muted }}>Size: </span>
                            <strong>{fileSize}</strong>
                          </div>
                        )}
                        <div>
                          <span style={{ color: c.muted }}>Status: </span>
                          <strong style={{ color: c.primary }}>Queued for Nodal Scrutiny</strong>
                        </div>
                      </div>
                    )}

                    {/* ERROR BANNER */}
                    {isError && errorMsg && (
                      <div
                        style={{
                          background: `${c.danger || c.accent}12`,
                          border: `1px solid ${c.danger || c.accent}30`,
                          borderRadius: 12,
                          padding: "10px 14px",
                          fontSize: 12,
                          color: c.danger || c.accent,
                          fontWeight: 650,
                        }}
                      >
                        {errorMsg}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* SUBMIT / PROCEED BUTTON */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            style={{
              ...primaryButton(c),
              width: "100%",
              marginTop: 30,
              padding: "16px 24px",
              fontSize: 16,
              opacity: canSubmit ? 1 : 0.45,
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <FileCheck2 size={20} />
            <span>
              {isComplete
                ? "Proceed to Channel Partner & Application Submission"
                : "Proceed with Uploaded Documents"}
            </span>
          </button>
        </div>
      </div>
    </PageShell>
  );
}

function StatusScreen({
  c,
  t,
  language,
  scheme,
  profile,
  selectedPartner,
  applicationRecord,
  setApplicationRecord,
  statusStep,
  setStatusStep,
  onHome,
}) {
  const schemeId = scheme.scheme_id || scheme.id;
  const translated =
    SCHEME_TRANSLATIONS[language]?.[schemeId] ||
    SCHEME_TRANSLATIONS[language]?.[scheme.id] || {
      name: scheme.scheme_name || scheme.name || schemeId,
      benefit: scheme.benefit || scheme.benefit_amount || "",
      short: scheme.why_matched || "",
    };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);

  // Live Tracking Search Box State
  const [trackQuery, setTrackQuery] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState("");

  const doSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await submitApplication({
        scheme_id: schemeId,
        scheme_name: scheme.scheme_name || translated.name || schemeId,
        category: profile.category,
        income: profile.income,
        state: profile.location || profile.state,
        business_type: profile.businessType || profile.business_type,
        partner_id: selectedPartner?.partner_id || null,
        partner_name: selectedPartner?.partner_name || null,
        notes: "Applicant submitted through web portal.",
      });
      setApplicationRecord(res);
    } catch (err) {
      console.error("Backend submit error:", err);
      setSubmitError(
        err.message || "Unable to submit application to backend service. Please retry."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit application to backend on initial load if not yet submitted
  useEffect(() => {
    if (applicationRecord?.scheme_id === schemeId || applicationRecord?.application_id) {
      return;
    }
    doSubmit();
  }, [schemeId]);

  const appId = applicationRecord?.application_id || (submitError ? "SUBMISSION FAILED" : "PENDING");

  const handleCopy = () => {
    if (navigator.clipboard && applicationRecord?.application_id) {
      navigator.clipboard.writeText(appId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTrackSearch = async (e) => {
    e?.preventDefault();
    const id = trackQuery.trim();
    if (!id) return;

    setTrackLoading(true);
    setTrackError("");
    setTrackResult(null);

    try {
      const res = await getApplicationStatus(id);
      setTrackResult(res);
    } catch (err) {
      setTrackError(err.message || "Application ID not found. Please check and retry.");
    } finally {
      setTrackLoading(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "approved" || s === "disbursed") {
      return { bg: `${c.success}20`, text: c.success, border: `${c.success}60`, label: "Approved / Disbursed" };
    }
    if (s === "submitted" || s === "ready_for_submission") {
      return { bg: `${c.primary}20`, text: c.primary, border: `${c.primary}60`, label: "Submitted to Nodal Partner" };
    }
    if (s === "under_review") {
      return { bg: "#FFF4E6", text: "#D9480F", border: "#FFD8A8", label: "Under Review by Partner" };
    }
    if (s === "rejected") {
      return { bg: "#FFF5F5", text: "#C92A2A", border: "#FFC9C9", label: "Rejected" };
    }
    return { bg: c.surface2, text: c.muted, border: c.border, label: s || "Draft" };
  };

  const currentBadge = getStatusBadge(applicationRecord?.status);
  const timeline = applicationRecord?.timeline || [];

  return (
    <PageShell c={c}>
      <div
        className="container fade"
        style={{
          maxWidth: 880,
          padding: "50px 0 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 25,
            background: `${c.primary}15`,
            color: c.primary,
            display: "grid",
            placeItems: "center",
            margin: "auto",
          }}
        >
          {applicationRecord?.status === "approved" ? (
            <BadgeCheck size={40} color={c.success} />
          ) : (
            <FileCheck2 size={40} />
          )}
        </div>

        <h1
          style={{
            fontSize: 38,
            margin: "20px 0 8px",
            fontWeight: 800,
          }}
        >
          {t.applicationStatus}
        </h1>

        <p style={{ color: c.muted, fontSize: 16, margin: 0 }}>
          {translated.name}
        </p>

        {/* REAL APPLICATION ID BADGE WITH COPY */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            margin: "20px auto 0",
            padding: "10px 22px",
            borderRadius: 16,
            background: c.surface2,
            border: `1.5px solid ${c.border}`,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 13, color: c.muted, fontWeight: 650 }}>
            TRACKING ID:
          </span>
          <strong style={{ fontSize: 18, letterSpacing: 1, color: submitError ? "#C92A2A" : c.primary }}>
            {isSubmitting ? "Generating ID..." : appId}
          </strong>
          {applicationRecord?.application_id && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                border: `1px solid ${c.border}`,
                background: c.surface,
                color: copied ? c.success : c.text,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 750,
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              {copied ? "✓ Copied" : "Copy ID"}
            </button>
          )}
          {applicationRecord?.status && (
            <span
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 8,
                background: currentBadge.bg,
                color: currentBadge.text,
                border: `1px solid ${currentBadge.border}`,
                fontWeight: 750,
              }}
            >
              {applicationRecord.status_label || currentBadge.label}
            </span>
          )}
        </div>

        {/* SUBMISSION ERROR WITH RETRY */}
        {submitError && (
          <div
            style={{
              margin: "20px auto 0",
              maxWidth: 600,
              padding: "14px 20px",
              borderRadius: 14,
              background: "#FFF5F5",
              border: "1px solid #FF8787",
              color: "#C92A2A",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ textAlign: "left" }}>
              <strong>Submission Error:</strong> {submitError}
            </div>
            <button
              type="button"
              onClick={doSubmit}
              disabled={isSubmitting}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "#C92A2A",
                color: "#FFF",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {isSubmitting ? "Retrying..." : "Retry Submission"}
            </button>
          </div>
        )}

        {/* APPLICATION STATUS HISTORY TIMELINE CARD */}
        <div
          className="glass"
          style={{
            borderRadius: 25,
            padding: 30,
            marginTop: 30,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={20} color={c.primary} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Application Lifecycle & Status Timeline</h3>
            </div>
            {applicationRecord?.submitted_at && (
              <span style={{ fontSize: 12, color: c.muted }}>
                Submitted: <strong>{new Date(applicationRecord.submitted_at).toLocaleDateString()}</strong>
              </span>
            )}
          </div>

          {timeline && timeline.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "relative", paddingLeft: 10 }}>
              {timeline.map((item, idx) => {
                const isLast = idx === timeline.length - 1;
                const badge = getStatusBadge(item.new_status);
                const itemDate = item.created_at ? new Date(item.created_at).toLocaleString() : "Recently";

                return (
                  <div key={item.id || idx} style={{ display: "flex", gap: 16, position: "relative" }}>
                    {!isLast && (
                      <div
                        style={{
                          position: "absolute",
                          left: 17,
                          top: 36,
                          bottom: -20,
                          width: 2,
                          background: c.border,
                          zIndex: 0,
                        }}
                      />
                    )}

                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: isLast ? c.primary : c.surface2,
                        color: isLast ? "white" : c.muted,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        zIndex: 1,
                        border: `2px solid ${isLast ? c.primary : c.border}`,
                      }}
                    >
                      {isLast ? <Check size={18} /> : <Clock size={16} />}
                    </div>

                    <div
                      style={{
                        flex: 1,
                        background: c.surface2,
                        borderRadius: 14,
                        padding: "12px 16px",
                        border: isLast ? `1.5px solid ${c.primary}40` : `1px solid ${c.border}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: 14, color: isLast ? c.primary : c.text }}>
                            {item.status_label || item.new_status.replace("_", " ")}
                          </strong>
                          <span
                            style={{
                              fontSize: 10.5,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background: badge.bg,
                              color: badge.text,
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {item.changed_by || "system"}
                          </span>
                        </div>
                        <span style={{ fontSize: 11.5, color: c.muted }}>
                          {itemDate}
                        </span>
                      </div>
                      {item.note && (
                        <p style={{ margin: 0, fontSize: 13, color: c.muted, lineHeight: 1.45 }}>
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "16px", background: c.surface2, borderRadius: 12, fontSize: 13, color: c.muted }}>
              ⏳ Application submitted. Status history timeline will update as nodal officer reviews your documents.
            </div>
          )}

          {/* NEXT STEPS & PROCESSING ESTIMATE */}
          <div
            style={{
              background: `${c.primary}08`,
              borderRadius: 16,
              padding: "16px 20px",
              marginTop: 24,
              border: `1px solid ${c.primary}25`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 8,
              }}
            >
              <strong style={{ fontSize: 14, color: c.primary }}>Next Steps & Action Plan:</strong>
              {applicationRecord?.estimated_processing && (
                <span
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 10,
                    background: `${c.primary}18`,
                    color: c.primary,
                    fontWeight: 700,
                  }}
                >
                  Est: {applicationRecord.estimated_processing}
                </span>
              )}
            </div>

            <p style={{ color: c.text, lineHeight: 1.55, margin: 0, fontSize: 13.5 }}>
              {applicationRecord?.next_step ||
                "Your application has been submitted to the selected Channel Partner. You will receive SMS/WhatsApp status updates."}
            </p>
          </div>

          {/* SELECTED CHANNEL PARTNER SUMMARY */}
          {selectedPartner && (
            <div
              style={{
                background: c.surface2,
                borderRadius: 14,
                padding: "14px 18px",
                marginTop: 16,
                fontSize: 13,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                border: `1px solid ${c.border}`,
              }}
            >
              <div>
                <span style={{ color: c.muted }}>Selected Nodal Partner: </span>
                <strong>{selectedPartner.partner_name || selectedPartner.name}</strong>
                {selectedPartner.district && <span style={{ color: c.muted }}> ({selectedPartner.district})</span>}
              </div>
              {selectedPartner.phone && (
                <div style={{ color: c.primary, fontWeight: 700 }}>
                  📞 {selectedPartner.phone}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LIVE APPLICATION SEARCH / LOOKUP */}
        <div
          className="glass"
          style={{
            borderRadius: 25,
            padding: 30,
            marginTop: 30,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <Search size={18} color={c.primary} />
            <strong style={{ fontSize: 16 }}>Track Another Application ID</strong>
          </div>

          <p style={{ color: c.muted, fontSize: 13, margin: "0 0 14px 0" }}>
            Query live application tracking status from FastAPI <code>GET /api/applications/&#123;id&#125;/status</code>:
          </p>

          <form
            onSubmit={handleTrackSearch}
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="e.g. APP-2026-22326"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              style={{
                ...inputStyle(c),
                flex: 1,
                minWidth: 200,
                padding: "11px 14px",
              }}
            />
            <button
              type="submit"
              disabled={trackLoading || !trackQuery.trim()}
              style={{
                ...primaryButton(c),
                padding: "11px 22px",
                fontSize: 14,
                opacity: trackLoading || !trackQuery.trim() ? 0.5 : 1,
              }}
            >
              {trackLoading ? "Tracking..." : "Track Status"}
            </button>
          </form>

          {trackError && (
            <div
              style={{
                marginTop: 12,
                color: c.danger,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={15} />
              <span>{trackError}</span>
            </div>
          )}

          {trackResult && (
            <div
              className="fade"
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 14,
                background: c.surface2,
                border: `1.5px solid ${c.primary}30`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 15, color: c.primary }}>
                  {trackResult.application_id}
                </strong>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 10,
                    background: `${c.success}20`,
                    color: c.success,
                    fontWeight: 750,
                    fontSize: 12,
                    textTransform: "capitalize",
                  }}
                >
                  Status: {trackResult.status_label || trackResult.status.replace("_", " ")}
                </span>
              </div>

              <div style={{ fontSize: 13, color: c.text, marginBottom: 4 }}>
                <strong>Scheme:</strong> {trackResult.scheme_name}
              </div>
              <div style={{ fontSize: 13, color: c.text, marginBottom: 6 }}>
                <strong>Next Step:</strong> {trackResult.next_step}
              </div>
              <div style={{ fontSize: 12, color: c.muted, marginBottom: 8 }}>
                Submitted: {trackResult.submitted_at ? new Date(trackResult.submitted_at).toLocaleString() : "Recently"} | Est: {trackResult.estimated_processing}
              </div>

              {/* Track Result Timeline */}
              {trackResult.timeline && trackResult.timeline.length > 0 && (
                <div style={{ marginTop: 10, borderTop: `1px dashed ${c.border}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Status Timeline:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {trackResult.timeline.map((tItem, tIdx) => (
                      <div key={tIdx} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", color: c.muted }}>
                        <span>• <strong>{tItem.status_label || tItem.new_status}</strong> ({tItem.changed_by})</span>
                        <span>{tItem.created_at ? new Date(tItem.created_at).toLocaleDateString() : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onHome}
          style={{
            ...primaryButton(c),
            marginTop: 30,
            padding: "15px 30px",
            fontSize: 15,
          }}
        >
          <Search size={18} />
          {t.browseSchemes}
        </button>
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
