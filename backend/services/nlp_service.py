"""
NLP Entity Extraction Service — Multilingual (English / Hindi / Hinglish).

Extracts structured profile entities (category, income, state, business_type,
project_cost) from natural conversational text in English, Hindi, Hinglish,
mixed-language, and Devanagari script.

Architecture contract:
  - extract_profile(text) -> dict  (called by routers/profile.py)
  - get_missing_fields(extracted) -> list[str]
  - generate_followup(missing_fields) -> Optional[str]
"""
import re
import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. INDIAN STATES — canonical names + aliases (English, Hindi, abbreviations)
# ═══════════════════════════════════════════════════════════════════════════════

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh",
]

# Map lowercase aliases → canonical state name
_STATE_ALIASES: dict[str, str] = {}

# Auto-populate exact lowercase match for every canonical state
for _s in INDIAN_STATES:
    _STATE_ALIASES[_s.lower()] = _s

# Abbreviations & common short forms
_STATE_ABBREV = {
    "up": "Uttar Pradesh",
    "mp": "Madhya Pradesh",
    "hp": "Himachal Pradesh",
    "ap": "Andhra Pradesh",
    "wb": "West Bengal",
    "jk": "Jammu and Kashmir",
    "j&k": "Jammu and Kashmir",
    "uk": "Uttarakhand",
}

# Hindi Devanagari names
_STATE_HINDI = {
    "उत्तर प्रदेश": "Uttar Pradesh",
    "मध्य प्रदेश": "Madhya Pradesh",
    "बिहार": "Bihar",
    "राजस्थान": "Rajasthan",
    "महाराष्ट्र": "Maharashtra",
    "गुजरात": "Gujarat",
    "हरियाणा": "Haryana",
    "पंजाब": "Punjab",
    "दिल्ली": "Delhi",
    "कर्नाटक": "Karnataka",
    "तमिल नाडु": "Tamil Nadu",
    "तमिलनाडु": "Tamil Nadu",
    "तेलंगाना": "Telangana",
    "केरल": "Kerala",
    "ओडिशा": "Odisha",
    "उड़ीसा": "Odisha",
    "झारखंड": "Jharkhand",
    "छत्तीसगढ़": "Chhattisgarh",
    "उत्तराखंड": "Uttarakhand",
    "पश्चिम बंगाल": "West Bengal",
    "असम": "Assam",
    "गोवा": "Goa",
    "हिमाचल प्रदेश": "Himachal Pradesh",
    "आंध्र प्रदेश": "Andhra Pradesh",
    "अरुणाचल प्रदेश": "Arunachal Pradesh",
    "मणिपुर": "Manipur",
    "मेघालय": "Meghalaya",
    "मिज़ोरम": "Mizoram",
    "मिजोरम": "Mizoram",
    "नागालैंड": "Nagaland",
    "सिक्किम": "Sikkim",
    "त्रिपुरा": "Tripura",
    "जम्मू और कश्मीर": "Jammu and Kashmir",
    "लद्दाख": "Ladakh",
}

# Roman Hindi (common transliterations)
_STATE_ROMAN_HINDI = {
    "uttar pradesh": "Uttar Pradesh",
    "madhya pradesh": "Madhya Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "west bengal": "West Bengal",
    "tamil nadu": "Tamil Nadu",
    "jammu and kashmir": "Jammu and Kashmir",
    "jammu kashmir": "Jammu and Kashmir",
}


# ═══════════════════════════════════════════════════════════════════════════════
# 2. BUSINESS TYPE VOCABULARY — English, Hindi, Hinglish synonyms
# ═══════════════════════════════════════════════════════════════════════════════

BUSINESS_KEYWORDS: dict[str, list[str]] = {
    "dairy": [
        "dairy", "dairy business", "dairy farm", "milk business", "milk farming",
        "milk dairy", "cow dairy", "buffalo dairy",
        "doodh ka business", "doodh ka kaam", "doodh ki dairy",
        "dairy kholna", "dairy farm kholna",
        "डेयरी", "डेयरी फार्म", "दूध का बिजनेस", "दूध का काम",
        "दूध की डेयरी", "दूध का व्यवसाय",
    ],
    "tailoring": [
        "tailoring", "tailor", "tailor shop", "stitching",
        "darzi", "silai", "silai ka business", "kapde silne ka kaam",
        "सिलाई", "दर्जी", "सिलाई का काम", "कपड़े सिलने का काम",
        "garment", "clothes",
    ],
    "farming": [
        "farming", "agriculture", "agri business", "agribusiness", "farm", "farmer",
        "kisan", "kheti", "kheti ka kaam",
        "खेती", "कृषि", "किसान", "खेती का काम",
    ],
    "street_vending": [
        "street vendor", "street vending", "vendor", "vending",
        "thela", "rehri", "cart", "stall",
        "thele ka business", "rehri lagani",
        "रेहड़ी", "ठेला", "स्टॉल",
    ],
    "food_processing": [
        "food business", "food processing", "food stall",
        "catering", "restaurant", "dhaba", "canteen",
        "khane ka business", "khana banana",
        "खाने का बिजनेस", "ढाबा", "खाना बनाने का काम",
        "खाना", "food",
    ],
    "beauty_wellness": [
        "beauty parlour", "beauty parlor", "parlor", "parlour", "salon",
        "beauty business", "makeup business", "beauty ka kaam",
        "parlour kholna", "parlor kholna",
        "ब्यूटी पार्लर", "सैलून", "beauty",
    ],
    "technology": [
        "software business", "it business", "technology startup", "tech startup",
        "computer shop", "computer business", "software company",
        "software", "technology", "tech",
    ],
    "trading": [
        "shop", "store", "retail", "trading",
        "dukan", "kirana shop", "kirana", "general store",
        "दुकान", "किराना", "दुकान खोलना",
    ],
    "manufacturing": [
        "manufacturing", "factory", "production unit", "manufacturing unit",
        "factory lagani", "production ka business",
        "फैक्ट्री", "उत्पादन",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CATEGORY PATTERNS — English, Hindi, Hinglish, abbreviations
# ═══════════════════════════════════════════════════════════════════════════════

# Ordered list: checked top-to-bottom, first match wins.
# Each entry: (canonical_value, compiled_regex)
_CATEGORY_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("SC", re.compile(
        r"(?:\bsc\b|\bscheduled\s*caste\b|अनुसूचित\s*जाति|एससी)",
        re.IGNORECASE,
    )),
    ("ST", re.compile(
        r"(?:\bst\b|\bscheduled\s*tribe\b|अनुसूचित\s*जनजाति|एसटी)",
        re.IGNORECASE,
    )),
    ("OBC", re.compile(
        r"(?:\bobc\b|\bother\s*backward\s*class(?:es)?\b|ओबीसी|पिछड़ा\s*वर्ग)",
        re.IGNORECASE,
    )),
    ("Women", re.compile(
        r"(?:\bwoman\b|\bwomen\b|\bfemale\b|\bmahila\b|महिला|औरत)",
        re.IGNORECASE,
    )),
    ("Minorities", re.compile(
        r"(?:\bminority\b|\bminorities\b|\balpasankhyak\b|अल्पसंख्यक)",
        re.IGNORECASE,
    )),
    ("General", re.compile(
        r"(?:\bgeneral\s*(?:category)?\b|सामान्य\s*(?:वर्ग)?)",
        re.IGNORECASE,
    )),
]


# ═══════════════════════════════════════════════════════════════════════════════
# 4. HINDI NUMBER WORDS → numeric value
# ═══════════════════════════════════════════════════════════════════════════════

_HINDI_NUMBER_WORDS: dict[str, float] = {
    # Devanagari
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5,
    "छह": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
    "बीस": 20, "पचास": 50, "पच्चीस": 25, "तीस": 30, "चालीस": 40,
    "साठ": 60, "सत्तर": 70, "अस्सी": 80, "नब्बे": 90,
    "डेढ़": 1.5, "ढाई": 2.5,
    # Roman Hindi
    "ek": 1, "do": 2, "teen": 3, "char": 4,
    "paanch": 5, "panch": 5, "pach": 5, "paach": 5,
    "cheh": 6, "saat": 7, "aath": 8, "nau": 9, "das": 10,
    "bees": 20, "pachaas": 50, "pachees": 25, "tees": 30,
    "chaalees": 40, "saath": 60, "sattar": 70, "assi": 80, "nabbe": 90,
    "dedh": 1.5, "dhai": 2.5,
}


# ═══════════════════════════════════════════════════════════════════════════════
# 5. HELPER — text normalization
# ═══════════════════════════════════════════════════════════════════════════════

def normalize_text(text: str) -> str:
    """
    Lightweight text normalization for multilingual NLP.
    - Strip leading/trailing whitespace
    - Collapse multiple spaces
    - Normalize common Hinglish spelling variations
    """
    text = text.strip()
    # Collapse multiple spaces / tabs
    text = re.sub(r"\s+", " ", text)
    return text


# ═══════════════════════════════════════════════════════════════════════════════
# 6. HELPER — money amount parsing
# ═══════════════════════════════════════════════════════════════════════════════

# Regex for a numeric value: digits with optional decimal, OR a Hindi/Roman
# number word, optionally preceded by ₹/Rs./Rs
_CURRENCY_PREFIX = r"(?:₹|rs\.?\s*|rupees?\s*|रुपये\s*|रुपए\s*|रूपये\s*)?"

# Build alternation of Hindi number words for regex (sorted longest first to
# prevent partial matches)
_HINDI_NUM_KEYS = sorted(_HINDI_NUMBER_WORDS.keys(), key=len, reverse=True)
_HINDI_NUM_ALT = "|".join(re.escape(k) for k in _HINDI_NUM_KEYS)

# Main money regex: captures (number_part) (multiplier)
# number_part = digits (e.g. 5, 5.5) OR Hindi number word
# multiplier  = lakh/lac/lakhs/crore/karod/हजार/लाख/करोड़ OR k/L
_MONEY_RE = re.compile(
    r"(?:" + _CURRENCY_PREFIX + r")"
    r"(?:(\d+(?:\.\d+)?)|(" + _HINDI_NUM_ALT + r"))"
    r"\s*"
    r"(lakh|lakhs?|lac|crore|karod|करोड़|लाख|हज़ार|हजार|thousand|k\b|l\b)?",
    re.IGNORECASE,
)

def _parse_multiplier(mult_str: Optional[str]) -> int:
    """Return numeric multiplier for lakh/crore/thousand/k/L tokens."""
    if mult_str is None:
        return 1
    m = mult_str.lower().strip()
    if m in ("lakh", "lakhs", "lac", "लाख", "l"):
        return 100_000
    if m in ("crore", "karod", "करोड़"):
        return 10_000_000
    if m in ("thousand", "हज़ार", "हजार", "k"):
        return 1_000
    return 1


def normalize_money(text: str) -> list[tuple[int, int, int]]:
    """
    Find all money amounts in the text.

    Returns list of (amount_in_inr, start_pos, end_pos) tuples.
    """
    results: list[tuple[int, int, int]] = []
    for m in _MONEY_RE.finditer(text):
        digit_part = m.group(1)
        word_part = m.group(2)
        multiplier_str = m.group(3)

        if digit_part is not None:
            num = float(digit_part)
        elif word_part is not None:
            key = word_part.lower() if word_part == word_part.lower() else word_part
            # Try exact match first, then lowercase
            num = _HINDI_NUMBER_WORDS.get(word_part)
            if num is None:
                num = _HINDI_NUMBER_WORDS.get(word_part.lower())
            if num is None:
                continue
        else:
            continue

        multiplier = _parse_multiplier(multiplier_str)

        # If no multiplier token but the number is very small (< 100) and
        # standalone, it's likely NOT a money amount. Skip it.
        if multiplier == 1 and num < 1000:
            continue

        amount = int(num * multiplier)
        if amount > 0:
            results.append((amount, m.start(), m.end()))

    return results


# ═══════════════════════════════════════════════════════════════════════════════
# 7. CONTEXT-AWARE MONEY CLASSIFICATION (income vs project_cost)
# ═══════════════════════════════════════════════════════════════════════════════

# Context keywords that signal INCOME
_INCOME_KEYWORDS = [
    "income", "salary", "earning", "kamai", "kamaayi", "aay",
    "annual income", "yearly income", "family income", "monthly income",
    "saalana income", "saalana aay", "ghar ki income",
    "meri income", "my income",
    "आय", "कमाई", "वार्षिक आय", "पारिवारिक आय",
    "सालाना आय", "मासिक आय", "आमदनी",
]

# Context keywords that signal PROJECT COST / LOAN
_PROJECT_COST_KEYWORDS = [
    "loan", "financial assistance", "assistance", "funding", "investment",
    "financing", "finance", "capital", "fund", "funds",
    "paisa", "paise", "rupaye", "rupees",
    "project cost", "project ki cost", "business cost",
    "chahiye", "chahie", "chaiye", "chahia",
    "madad", "sahayata", "zarurat", "zaroorat",
    "ke liye", "ke lye", "business ke liye",
    "start karne ke liye", "kholne ke liye",
    "ऋण", "लोन", "वित्तीय सहायता", "सहायता",
    "निवेश", "लागत", "मदद", "ज़रूरत", "जरूरत",
    "चाहिए", "फाइनेंसिंग", "फाइनेंस", "पूंजी",
]


def _classify_money_context(text: str, amount: int, start: int, end: int) -> str:
    """
    Determine whether a money amount is 'income' or 'project_cost' based on
    the distance-weighted surrounding text context.

    Returns 'income', 'project_cost', or 'unknown'.
    """
    before = text[:start].lower()
    after = text[end:].lower()

    income_score = 0.0
    for kw in _INCOME_KEYWORDS:
        idx = before.rfind(kw)
        if idx != -1:
            dist = len(before) - (idx + len(kw))
            if dist <= 50:
                income_score += 15.0 / (dist + 1)
        idx_after = after.find(kw)
        if idx_after != -1 and idx_after <= 50:
            income_score += 15.0 / (idx_after + 1)

    cost_score = 0.0
    for kw in _PROJECT_COST_KEYWORDS:
        idx = before.rfind(kw)
        if idx != -1:
            dist = len(before) - (idx + len(kw))
            if dist <= 50:
                cost_score += 15.0 / (dist + 1)
        idx_after = after.find(kw)
        if idx_after != -1 and idx_after <= 50:
            cost_score += 15.0 / (idx_after + 1)

    if income_score > cost_score and income_score > 0.1:
        return "income"
    if cost_score > income_score and cost_score > 0.1:
        return "project_cost"

    return "unknown"


def extract_income_and_cost(text: str) -> tuple[Optional[int], Optional[int]]:
    """
    Extract income and project_cost from text using context-aware classification.

    Returns (income, project_cost). Either or both may be None.
    """
    text_norm = normalize_text(text)
    amounts = normalize_money(text_norm)

    income: Optional[int] = None
    project_cost: Optional[int] = None

    for amount, start, end in amounts:
        classification = _classify_money_context(text_norm, amount, start, end)

        if classification == "income" and income is None:
            income = amount
        elif classification == "project_cost" and project_cost is None:
            project_cost = amount
        elif classification == "unknown":
            # If we haven't assigned project_cost yet, default ambiguous
            # money to project_cost (common pattern: "mujhe 5 lakh chahiye")
            if project_cost is None:
                project_cost = amount
            elif income is None:
                income = amount

    return income, project_cost


# ═══════════════════════════════════════════════════════════════════════════════
# 8. CATEGORY EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_category(text: str) -> Optional[str]:
    """Extract social/caste category from text."""
    for canonical, pattern in _CATEGORY_PATTERNS:
        if pattern.search(text):
            # Guard against "general store" being classified as "General" category
            if canonical == "General":
                if re.search(r"\bgeneral\s+store\b", text, re.IGNORECASE):
                    continue
            return canonical
    return None


# ═══════════════════════════════════════════════════════════════════════════════
# 9. STATE EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_state(text: str) -> Optional[str]:
    """Extract Indian state/UT from text (supports English, Hindi, abbreviations)."""
    text_norm = normalize_text(text)

    # 1. Check Hindi Devanagari state names (longest first)
    for hindi_name, canonical in sorted(_STATE_HINDI.items(), key=lambda x: len(x[0]), reverse=True):
        if hindi_name in text_norm:
            return canonical

    # 2. Check Roman Hindi / multi-word state names (longest first)
    text_lower = text_norm.lower()
    for alias, canonical in sorted(_STATE_ROMAN_HINDI.items(), key=lambda x: len(x[0]), reverse=True):
        if alias in text_lower:
            return canonical

    # 3. Check exact canonical state names (longest first to match "Madhya Pradesh"
    #    before "Pradesh")
    for state in sorted(INDIAN_STATES, key=len, reverse=True):
        if state.lower() in text_lower:
            return state

    # 4. Check abbreviations (word-boundary match to avoid false positives)
    for abbrev, canonical in _STATE_ABBREV.items():
        if re.search(r"\b" + re.escape(abbrev) + r"\b", text_lower):
            return canonical

    return None


# ═══════════════════════════════════════════════════════════════════════════════
# 10. BUSINESS TYPE EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_business_type(text: str) -> Optional[str]:
    """Extract business type from text using vocabulary matching."""
    text_lower = text.lower()

    # Score each business type by how many keywords match (longest keyword first)
    best_type: Optional[str] = None
    best_score = 0
    best_keyword_len = 0

    for btype, keywords in BUSINESS_KEYWORDS.items():
        score = 0
        longest_match = 0
        for kw in keywords:
            if kw.lower() in text_lower:
                score += 1
                if len(kw) > longest_match:
                    longest_match = len(kw)

        # Prefer the type with the longest matching keyword, then highest count
        if score > 0 and (longest_match > best_keyword_len or
                          (longest_match == best_keyword_len and score > best_score)):
            best_type = btype
            best_score = score
            best_keyword_len = longest_match

    # Special guard: "general store" → trading, not technology's "store"
    if best_type is None:
        if re.search(r"\b(?:dukan|दुकान)\b", text_lower):
            return "trading"

    return best_type


# ═══════════════════════════════════════════════════════════════════════════════
# 10B. INTENT EXTRACTION (Financial Assistance vs Skill Training vs Pension)
# ═══════════════════════════════════════════════════════════════════════════════

_SKILL_TRAINING_KEYWORDS = [
    "skill training", "skill development", "training", "course", "seekhna",
    "sikhna", "hunar", "kaushal", "prashikshan", "certificate course",
    "talim", "seekhni", "sikhana", "ट्रेनिंग", "प्रशिक्षण", "कौशल", "सीखना",
]

_PENSION_KEYWORDS = [
    "pension", "retirement", "old age", "budhapa", "60 saal", "60 varsh",
    "पेंशन", "वृद्धावस्था",
]

_FINANCE_KEYWORDS = [
    "financial assistance", "finance", "loan", "subsidy", "funding", "credit",
    "capital", "investment", "chahiye", "sahayata", "madad", "zarurat",
    "business start", "kholna", "lagani", "karz", "paisa", "rupaye",
    "सहायता", "ऋण", "लोन", "सब्सिडी", "पैसा", "रुपये", "चाहिए",
]


def extract_intent(text: str, project_cost: Optional[int] = None) -> str:
    """
    Extract user core intent from text.
    Returns: 'financial_assistance', 'business_loan', 'skill_training', 'pension', or 'general_query'.
    """
    text_lower = text.lower()

    # Check pension first
    for kw in _PENSION_KEYWORDS:
        if kw in text_lower:
            return "pension"

    # Check skill training (if not also asking for significant loan/project cost)
    is_training = any(kw in text_lower for kw in _SKILL_TRAINING_KEYWORDS)
    is_finance = any(kw in text_lower for kw in _FINANCE_KEYWORDS) or (project_cost and project_cost >= 10000)

    if is_training and not is_finance:
        return "skill_training"

    # Default for entrepreneurial scheme platform
    return "financial_assistance"


# ═══════════════════════════════════════════════════════════════════════════════
# 11. MAIN EXTRACT FUNCTION
# ═══════════════════════════════════════════════════════════════════════════════

def extract_profile(text: str) -> dict:
    """
    Extract structured profile dictionary from raw natural language text.

    Supports English, Hindi, Hinglish, mixed-language, and Devanagari.

    Returns dict with keys: category, income, state, business_type, project_cost, intent.
    """
    if not text:
        return {
            "category": None,
            "income": None,
            "state": None,
            "business_type": None,
            "project_cost": None,
            "intent": "financial_assistance",
        }

    text = normalize_text(text)

    # 1. Category
    category = extract_category(text)

    # 2. State
    state = extract_state(text)

    # 3. Business type
    business_type = extract_business_type(text)

    # 4. Income and Project Cost (context-aware)
    income, project_cost = extract_income_and_cost(text)

    # 5. Intent
    intent = extract_intent(text, project_cost)

    return {
        "category": category,
        "income": income,
        "state": state,
        "business_type": business_type,
        "project_cost": project_cost,
        "intent": intent,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 12. MISSING FIELDS & FOLLOW-UP (unchanged contract)
# ═══════════════════════════════════════════════════════════════════════════════

def get_missing_fields(extracted: dict) -> list[str]:
    """Identify which core profile fields are not yet provided."""
    core_fields = ["category", "income", "state", "business_type", "project_cost"]
    return [field for field in core_fields if extracted.get(field) is None]


def generate_followup(missing_fields: list[str]) -> Optional[str]:
    """Generate a conversational follow-up question for the user in Hindi/English."""
    if not missing_fields:
        return None

    first_missing = missing_fields[0]
    questions = {
        "category": "आपकी सामाजिक श्रेणी (Category) क्या है? (जैसे SC, ST, OBC, General या Women)",
        "income": "आपकी वार्षिक पारिवारिक आय (Annual Income) लगभग कितनी है?",
        "state": "आप किस राज्य (State) में अपना व्यवसाय शुरू करना या चलाना चाहते हैं?",
        "business_type": "आपका व्यवसाय या कार्य किस प्रकार का है? (जैसे सिलाई, दुकान, फार्मिंग आदि)",
        "project_cost": "आपके प्रोजेक्ट या व्यवसाय के लिए अनुमानित लागत (Project Cost) कितनी होगी?",
    }
    return questions.get(first_missing, "कृपया अपने व्यवसाय के बारे में थोड़ी और जानकारी दें।")
