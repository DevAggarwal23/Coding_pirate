"""
Multilingual NLP Profile Extraction Tests — English, Hindi, Hinglish.

Run: pytest tests/test_nlp_multilingual.py -v

Tests the enhanced services/nlp_service.py for:
- Category extraction (SC, ST, OBC, Women, Minorities, General)
- State extraction (English, Hindi, abbreviations)
- Business type extraction (dairy, tailoring, farming, etc.)
- Income vs project_cost context-aware classification
- Hindi number words and currency normalization
- Mixed-language sentences
- Devanagari Hindi
- Common conversational Hinglish
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.nlp_service import (
    extract_profile,
    get_missing_fields,
    generate_followup,
    normalize_money,
    extract_category,
    extract_state,
    extract_business_type,
    extract_income_and_cost,
)


# ══════════════════════════════════════════════════════════════════════════════
# TEST 1 — HINGLISH FULL SENTENCE
# ══════════════════════════════════════════════════════════════════════════════

class TestHinglishFullSentence:

    def test_hinglish_dairy_obc_up(self):
        """TEST 1: Hinglish dairy + OBC + UP + 5 lakh financial assistance."""
        text = (
            "Mujhe dairy business start karna hai aur mujhe 5 lakh rupaye ki "
            "financial assistance chahiye. Main OBC category se hoon aur "
            "Uttar Pradesh mein rehta hoon."
        )
        result = extract_profile(text)
        assert result["category"] == "OBC"
        assert result["state"] == "Uttar Pradesh"
        assert result["business_type"] == "dairy"
        assert result["project_cost"] == 500000
        assert result["income"] is None


# ══════════════════════════════════════════════════════════════════════════════
# TEST 2 — ENGLISH FULL SENTENCE
# ══════════════════════════════════════════════════════════════════════════════

class TestEnglishFullSentence:

    def test_english_dairy_obc_up(self):
        """TEST 2: English dairy + OBC + UP + ₹5 lakh loan."""
        text = (
            "I want to start a dairy business in Uttar Pradesh. "
            "I belong to the OBC category and need a loan of ₹5 lakh."
        )
        result = extract_profile(text)
        assert result["category"] == "OBC"
        assert result["state"] == "Uttar Pradesh"
        assert result["business_type"] == "dairy"
        assert result["project_cost"] == 500000
        assert result["income"] is None


# ══════════════════════════════════════════════════════════════════════════════
# TEST 3 — HINDI (DEVANAGARI)
# ══════════════════════════════════════════════════════════════════════════════

class TestHindiDevanagari:

    def test_hindi_dairy_obc_up(self):
        """TEST 3: Hindi Devanagari — dairy + OBC + UP + 5 lakh."""
        text = (
            "मुझे डेयरी का व्यवसाय शुरू करना है और मुझे 5 लाख रुपये की "
            "वित्तीय सहायता चाहिए। मैं ओबीसी श्रेणी से हूँ और "
            "उत्तर प्रदेश में रहता हूँ।"
        )
        result = extract_profile(text)
        assert result["category"] == "OBC"
        assert result["state"] == "Uttar Pradesh"
        assert result["business_type"] == "dairy"
        assert result["project_cost"] == 500000
        assert result["income"] is None


# ══════════════════════════════════════════════════════════════════════════════
# TEST 4 — INCOME EXTRACTION (HINDI)
# ══════════════════════════════════════════════════════════════════════════════

class TestIncomeExtraction:

    def test_hindi_income_up(self):
        """TEST 4: Hindi income + state extraction."""
        text = "मेरी वार्षिक पारिवारिक आय 3 लाख रुपये है और मैं उत्तर प्रदेश में रहता हूँ।"
        result = extract_profile(text)
        assert result["income"] == 300000
        assert result["state"] == "Uttar Pradesh"
        assert result["project_cost"] is None


# ══════════════════════════════════════════════════════════════════════════════
# TEST 5 — BOTH INCOME AND PROJECT COST
# ══════════════════════════════════════════════════════════════════════════════

class TestBothIncomeAndCost:

    def test_hinglish_both_amounts(self):
        """TEST 5: Hinglish both income + project cost."""
        text = (
            "Main dairy farm start karna chahta hu. "
            "Meri annual income 2 lakh hai aur mujhe business ke liye 5 lakh loan chahiye."
        )
        result = extract_profile(text)
        assert result["business_type"] == "dairy"
        assert result["income"] == 200000
        assert result["project_cost"] == 500000


# ══════════════════════════════════════════════════════════════════════════════
# TEST 6 — DAIRY VARIATION (HINDI)
# ══════════════════════════════════════════════════════════════════════════════

class TestDairyVariation:

    def test_hindi_doodh_vyavsay(self):
        """TEST 6: Hindi दूध का व्यवसाय → dairy."""
        text = "मुझे दूध का व्यवसाय शुरू करना है।"
        result = extract_profile(text)
        assert result["business_type"] == "dairy"


# ══════════════════════════════════════════════════════════════════════════════
# TEST 7 — TAILORING
# ══════════════════════════════════════════════════════════════════════════════

class TestTailoring:

    def test_hinglish_silai(self):
        """TEST 7: Hinglish silai → tailoring + 3 lakh."""
        text = "Mujhe silai ka business start karna hai aur 3 lakh ki financial assistance chahiye."
        result = extract_profile(text)
        assert result["business_type"] == "tailoring"
        assert result["project_cost"] == 300000


# ══════════════════════════════════════════════════════════════════════════════
# TEST 8 — FARMING
# ══════════════════════════════════════════════════════════════════════════════

class TestFarming:

    def test_hinglish_kheti(self):
        """TEST 8: Hinglish kheti → farming + 4 lakh loan."""
        text = "Main kheti ke liye 4 lakh ka loan chahta hu."
        result = extract_profile(text)
        assert result["business_type"] == "farming"
        assert result["project_cost"] == 400000


# ══════════════════════════════════════════════════════════════════════════════
# TEST 9 — SHOP / TRADING
# ══════════════════════════════════════════════════════════════════════════════

class TestTrading:

    def test_hinglish_kirana_shop(self):
        """TEST 9: Hinglish kirana shop → trading + 2 lakh."""
        text = "Mujhe ek kirana shop kholni hai aur 2 lakh chahiye."
        result = extract_profile(text)
        assert result["business_type"] == "trading"
        assert result["project_cost"] == 200000


# ══════════════════════════════════════════════════════════════════════════════
# TEST 10 — MIXED LANGUAGE
# ══════════════════════════════════════════════════════════════════════════════

class TestMixedLanguage:

    def test_mixed_hindi_english(self):
        """TEST 10: Mixed Hindi+English — income + dairy + ₹5 lakh loan."""
        text = "मेरी annual income 2 lakh है और मुझे dairy business के लिए ₹5 lakh loan चाहिए।"
        result = extract_profile(text)
        assert result["income"] == 200000
        assert result["business_type"] == "dairy"
        assert result["project_cost"] == 500000


# ══════════════════════════════════════════════════════════════════════════════
# TEST 11 — CURRENCY: ₹5.5 LAKH
# ══════════════════════════════════════════════════════════════════════════════

class TestCurrency:

    def test_five_point_five_lakh(self):
        """TEST 11: ₹5.5 lakh → 550000."""
        text = "I need ₹5.5 lakh for my business."
        result = extract_profile(text)
        assert result["project_cost"] == 550000

    def test_one_crore(self):
        """TEST 12: 1 crore + manufacturing."""
        text = "I need 1 crore for my manufacturing business."
        result = extract_profile(text)
        assert result["business_type"] == "manufacturing"
        assert result["project_cost"] == 10000000


# ══════════════════════════════════════════════════════════════════════════════
# ADDITIONAL CATEGORY TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestCategoryExtraction:

    def test_sc_english(self):
        assert extract_category("I belong to SC category") == "SC"

    def test_sc_hindi(self):
        assert extract_category("अनुसूचित जाति") == "SC"

    def test_sc_hinglish(self):
        assert extract_category("main SC category se hoon") == "SC"

    def test_sc_devanagari_abbrev(self):
        assert extract_category("एससी") == "SC"

    def test_st_english(self):
        assert extract_category("I belong to ST") == "ST"

    def test_st_hindi(self):
        assert extract_category("अनुसूचित जनजाति") == "ST"

    def test_obc_english(self):
        assert extract_category("Other Backward Class") == "OBC"

    def test_obc_hinglish(self):
        assert extract_category("meri category OBC hai") == "OBC"

    def test_obc_hindi(self):
        assert extract_category("पिछड़ा वर्ग") == "OBC"

    def test_women_english(self):
        assert extract_category("I am a woman entrepreneur") == "Women"

    def test_women_hindi_mahila(self):
        assert extract_category("mahila") == "Women"

    def test_women_hindi_devanagari(self):
        assert extract_category("महिला") == "Women"

    def test_minority_english(self):
        assert extract_category("minority") == "Minorities"

    def test_minority_hindi(self):
        assert extract_category("अल्पसंख्यक") == "Minorities"

    def test_general_english(self):
        assert extract_category("I am from general category") == "General"

    def test_general_hindi(self):
        assert extract_category("सामान्य वर्ग") == "General"

    def test_general_store_not_category(self):
        """'general store' should NOT be classified as General category."""
        assert extract_category("I want to open a general store") is None


# ══════════════════════════════════════════════════════════════════════════════
# ADDITIONAL STATE TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestStateExtraction:

    def test_up_abbreviation(self):
        assert extract_state("UP mein rehta hu") == "Uttar Pradesh"

    def test_up_full_english(self):
        assert extract_state("I live in Uttar Pradesh") == "Uttar Pradesh"

    def test_up_hindi(self):
        assert extract_state("मैं उत्तर प्रदेश में रहता हूँ") == "Uttar Pradesh"

    def test_bihar_english(self):
        assert extract_state("I am from Bihar") == "Bihar"

    def test_bihar_hindi(self):
        assert extract_state("बिहार") == "Bihar"

    def test_rajasthan_hindi(self):
        assert extract_state("राजस्थान") == "Rajasthan"

    def test_maharashtra_hindi(self):
        assert extract_state("महाराष्ट्र") == "Maharashtra"

    def test_mp_abbreviation(self):
        assert extract_state("MP mein business karna hai") == "Madhya Pradesh"

    def test_delhi_hindi(self):
        assert extract_state("दिल्ली") == "Delhi"

    def test_gujarat_hindi(self):
        assert extract_state("गुजरात") == "Gujarat"

    def test_tamil_nadu(self):
        assert extract_state("Tamil Nadu") == "Tamil Nadu"


# ══════════════════════════════════════════════════════════════════════════════
# ADDITIONAL BUSINESS TYPE TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestBusinessTypeExtraction:

    def test_dairy_english(self):
        assert extract_business_type("I want to start a dairy business") == "dairy"

    def test_dairy_hinglish_doodh(self):
        assert extract_business_type("doodh ka business karna hai") == "dairy"

    def test_dairy_hindi(self):
        assert extract_business_type("डेयरी फार्म") == "dairy"

    def test_tailoring_hinglish(self):
        assert extract_business_type("silai ka business") == "tailoring"

    def test_tailoring_hindi(self):
        assert extract_business_type("सिलाई का काम") == "tailoring"

    def test_farming_hinglish(self):
        assert extract_business_type("kheti ka kaam") == "farming"

    def test_farming_hindi(self):
        assert extract_business_type("कृषि") == "farming"

    def test_street_vending_thela(self):
        assert extract_business_type("thela lagana hai") == "street_vending"

    def test_street_vending_hindi(self):
        assert extract_business_type("ठेला") == "street_vending"

    def test_food_dhaba(self):
        assert extract_business_type("dhaba kholna hai") == "food_processing"

    def test_food_hindi(self):
        assert extract_business_type("ढाबा") == "food_processing"

    def test_beauty_parlour(self):
        assert extract_business_type("beauty parlour kholna hai") == "beauty_wellness"

    def test_beauty_hindi(self):
        assert extract_business_type("ब्यूटी पार्लर") == "beauty_wellness"

    def test_technology(self):
        assert extract_business_type("software company start karna hai") == "technology"

    def test_trading_dukan(self):
        assert extract_business_type("दुकान खोलना है") == "trading"

    def test_trading_kirana(self):
        assert extract_business_type("kirana shop") == "trading"

    def test_manufacturing(self):
        assert extract_business_type("factory lagani hai") == "manufacturing"

    def test_manufacturing_hindi(self):
        assert extract_business_type("फैक्ट्री") == "manufacturing"


# ══════════════════════════════════════════════════════════════════════════════
# MONEY NORMALIZATION TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestMoneyNormalization:

    def test_5_lakh(self):
        amounts = normalize_money("5 lakh")
        assert len(amounts) >= 1
        assert amounts[0][0] == 500000

    def test_5_lakhs(self):
        amounts = normalize_money("5 lakhs")
        assert amounts[0][0] == 500000

    def test_5_lac(self):
        amounts = normalize_money("5 lac")
        assert amounts[0][0] == 500000

    def test_5_point_5_lakh(self):
        amounts = normalize_money("5.5 lakh")
        assert amounts[0][0] == 550000

    def test_10_lakh(self):
        amounts = normalize_money("10 lakh")
        assert amounts[0][0] == 1000000

    def test_1_crore(self):
        amounts = normalize_money("1 crore")
        assert amounts[0][0] == 10000000

    def test_2_crore(self):
        amounts = normalize_money("2 crore")
        assert amounts[0][0] == 20000000

    def test_rs_5_lakh(self):
        amounts = normalize_money("Rs 5 lakh")
        assert amounts[0][0] == 500000

    def test_rupee_symbol_5_lakh(self):
        amounts = normalize_money("₹5 lakh")
        assert amounts[0][0] == 500000

    def test_hindi_5_lakh(self):
        amounts = normalize_money("5 लाख")
        assert amounts[0][0] == 500000

    def test_hindi_number_word_paanch_lakh(self):
        amounts = normalize_money("पाँच लाख")
        assert amounts[0][0] == 500000

    def test_hindi_number_word_das_lakh(self):
        amounts = normalize_money("दस लाख")
        assert amounts[0][0] == 1000000

    def test_hindi_number_word_ek_lakh(self):
        amounts = normalize_money("एक लाख")
        assert amounts[0][0] == 100000

    def test_dedh_lakh(self):
        amounts = normalize_money("डेढ़ लाख")
        assert amounts[0][0] == 150000

    def test_dhai_lakh(self):
        amounts = normalize_money("ढाई लाख")
        assert amounts[0][0] == 250000


# ══════════════════════════════════════════════════════════════════════════════
# FALSE POSITIVE GUARD TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestFalsePositiveGuards:

    def test_2_cows_not_money(self):
        """'I have 2 cows' should NOT produce income or project_cost."""
        result = extract_profile("I have 2 cows")
        assert result["income"] is None
        assert result["project_cost"] is None

    def test_3_workers_not_money(self):
        """'The business has 3 workers' should NOT produce income or project_cost."""
        result = extract_profile("The business has 3 workers")
        assert result["income"] is None
        assert result["project_cost"] is None


# ══════════════════════════════════════════════════════════════════════════════
# CONFIDENCE & MISSING FIELDS
# ══════════════════════════════════════════════════════════════════════════════

class TestConfidenceAndMissing:

    def test_four_fields_filled(self):
        """4/5 fields filled → confidence 0.8, missing_fields = ['income']."""
        text = (
            "Mujhe dairy business start karna hai aur mujhe 5 lakh rupaye ki "
            "financial assistance chahiye. Main OBC category se hoon aur "
            "Uttar Pradesh mein rehta hoon."
        )
        result = extract_profile(text)
        missing = get_missing_fields(result)
        assert missing == ["income"]
        filled = 5 - len(missing)
        confidence = round(filled / 5, 2)
        assert confidence == 0.8

    def test_all_fields_filled(self):
        """All 5 fields → confidence 1.0, missing_fields = []."""
        text = (
            "Meri annual income 2 lakh hai aur mujhe business ke liye 5 lakh loan chahiye. "
            "Main OBC category se hoon, Uttar Pradesh mein dairy farm start karna chahta hu."
        )
        result = extract_profile(text)
        missing = get_missing_fields(result)
        assert missing == []
        confidence = round((5 - len(missing)) / 5, 2)
        assert confidence == 1.0

    def test_followup_generated_for_missing(self):
        """Follow-up question should be generated for missing fields."""
        question = generate_followup(["income", "category"])
        assert isinstance(question, str)
        assert len(question) > 5

    def test_no_followup_when_complete(self):
        """No follow-up when all fields present."""
        assert generate_followup([]) is None
