import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calculator,
  IndianRupee,
  Percent,
  CalendarDays,
  Sparkles,
  Sliders,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
  HelpCircle,
  Landmark,
  Wallet,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import {
  calculateEmi,
  simulateWhatIf,
  assessFinancialReadiness,
} from "../services/api/financeApi.js";

function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rs. 0";
  return "Rs. " + Math.round(Number(amount)).toLocaleString("en-IN");
}

export function FinancialCalculator({
  c,
  t,
  scheme,
  profile,
  onHandoff,
  onBack,
}) {
  const schemeName = scheme?.scheme_name || scheme?.name || "Government Scheme";
  const schemeId = scheme?.scheme_id || scheme?.id || null;
  const schemeMaxLoan = scheme?.max_loan_amount
    ? Number(scheme.max_loan_amount)
    : scheme?.maxLoan
    ? Number(scheme.maxLoan)
    : null;

  // 1. Initial State from Profile / Scheme Defaults
  const initialLoan = useMemo(() => {
    if (profile?.project_cost && Number(profile.project_cost) > 0) {
      const pc = Number(profile.project_cost);
      return schemeMaxLoan ? Math.min(pc, schemeMaxLoan) : pc;
    }
    return schemeMaxLoan ? Math.min(500000, schemeMaxLoan) : 500000;
  }, [profile, schemeMaxLoan]);

  // Base Scenario State
  const [loanAmount, setLoanAmount] = useState(initialLoan);
  const [interestRate, setInterestRate] = useState(7.5);
  const [tenureYears, setTenureYears] = useState(5);

  // What-If Scenario State
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [scenarioLoan, setScenarioLoan] = useState(initialLoan > 300000 ? initialLoan - 100000 : initialLoan + 100000);
  const [scenarioRate, setScenarioRate] = useState(7.5);
  const [scenarioTenure, setScenarioTenure] = useState(7);

  // Cashflow & Financial Readiness State
  const [monthlyIncome, setMonthlyIncome] = useState(
    profile?.income ? Math.round(Number(profile.income) / 12) : 35000
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState(
    profile?.income ? Math.round((Number(profile.income) / 12) * 0.45) : 15000
  );
  const [existingEmi, setExistingEmi] = useState(0);

  // API Results & Loading State
  const [baseCalculation, setBaseCalculation] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [readinessResult, setReadinessResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator"); // "calculator" | "whatif" | "readiness"

  // Mathematical Reducing-Balance Calculation (matches backend 100%)
  const computeLocalEmi = useCallback((p, rAnnual, y) => {
    const n = Math.max(1, Math.round(y * 12));
    if (p <= 0) return { emi: 0, totalInterest: 0, totalPayment: 0 };
    if (rAnnual === 0) {
      const emi = Math.round((p / n) * 100) / 100;
      return { emi, totalInterest: 0, totalPayment: Math.round(p * 100) / 100 };
    }
    const r = (rAnnual / 100.0) / 12.0;
    const factor = Math.pow(1.0 + r, n);
    const emi = Math.round(((p * r * factor) / (factor - 1.0)) * 100) / 100;
    const totalPayment = Math.round(emi * n * 100) / 100;
    const totalInterest = Math.round(Math.max(0, totalPayment - p) * 100) / 100;
    return { emi, totalInterest, totalPayment };
  }, []);

  // Base Local Values for Instant Slider Feedback
  const baseLocal = useMemo(
    () => computeLocalEmi(loanAmount, interestRate, tenureYears),
    [loanAmount, interestRate, tenureYears, computeLocalEmi]
  );

  const scenarioLocal = useMemo(
    () => computeLocalEmi(scenarioLoan, scenarioRate, scenarioTenure),
    [scenarioLoan, scenarioRate, scenarioTenure, computeLocalEmi]
  );

  // Scheme Limit Violation Check
  const exceedsLimit = schemeMaxLoan !== null && loanAmount > schemeMaxLoan;
  const scenarioExceedsLimit = schemeMaxLoan !== null && scenarioLoan > schemeMaxLoan;

  // 2. Fetch Backend Calculations (non-blocking — runs silently in background)
  // Local math results are shown immediately; backend enhances them if available.
  useEffect(() => {
    let isMounted = true;
    // Debounce to avoid spamming backend on every slider tick
    const timer = setTimeout(async () => {
      setIsCalculating(true);
      try {
        const [emiRes, whatIfRes, readinessRes] = await Promise.allSettled([
          calculateEmi({
            principal: loanAmount,
            annual_interest_rate: interestRate,
            tenure_months: tenureYears * 12,
            scheme_id: schemeId,
          }),
          simulateWhatIf({
            scheme_id: schemeId,
            base: {
              loan_amount: loanAmount,
              annual_interest_rate: interestRate,
              tenure_years: tenureYears,
            },
            scenario: {
              loan_amount: scenarioLoan,
              annual_interest_rate: scenarioRate,
              tenure_years: scenarioTenure,
            },
            financial_profile: {
              monthly_income: monthlyIncome,
              monthly_expenses: monthlyExpenses,
              existing_emi: existingEmi,
            },
          }),
          assessFinancialReadiness({
            monthly_income: monthlyIncome,
            monthly_household_expenses: monthlyExpenses,
            existing_emi: existingEmi,
            requested_loan_amount: loanAmount,
            annual_interest_rate: interestRate,
            tenure_months: tenureYears * 12,
            scheme_id: schemeId,
          }),
        ]);

        if (isMounted) {
          if (emiRes.status === "fulfilled" && emiRes.value?.is_valid) {
            setBaseCalculation(emiRes.value);
          }
          if (whatIfRes.status === "fulfilled" && whatIfRes.value?.success) {
            setWhatIfResult(whatIfRes.value);
          }
          if (readinessRes.status === "fulfilled" && readinessRes.value?.is_valid) {
            setReadinessResult(readinessRes.value);
          }
        }
      } catch (err) {
        console.debug("Backend financial service (offline — using local math):", err);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    }, 600);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    loanAmount,
    interestRate,
    tenureYears,
    scenarioLoan,
    scenarioRate,
    scenarioTenure,
    monthlyIncome,
    monthlyExpenses,
    existingEmi,
    schemeId,
  ]);

  // Derived display values
  const displayEmi = baseCalculation?.monthly_emi || baseLocal.emi;
  const displayTotalInterest = baseCalculation?.total_interest || baseLocal.totalInterest;
  const displayTotalRepayment = baseCalculation?.total_repayment || baseLocal.totalPayment;

  const displayScenarioEmi = whatIfResult?.scenario?.monthly_emi || scenarioLocal.emi;
  const displayScenarioInterest = whatIfResult?.scenario?.total_interest || scenarioLocal.totalInterest;
  const displayScenarioRepayment = whatIfResult?.scenario?.total_repayment || scenarioLocal.totalPayment;

  // Debt Burden Ratio Calculation
  const totalDebt = Math.round(existingEmi + displayEmi);
  const burdenRatio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) : 0;
  const burdenPct = Math.round(burdenRatio * 100);
  const disposableAfter = Math.round(monthlyIncome - monthlyExpenses - totalDebt);

  const readinessStatus =
    disposableAfter < 0 || burdenRatio > 0.40
      ? { label: "High Repayment Burden", color: c.danger, badge: "Review Needed", level: "high" }
      : burdenRatio <= 0.30
      ? { label: "Comfortable Repayment Burden", color: c.success, badge: "Comfortable", level: "comfortable" }
      : { label: "Moderate Repayment Burden", color: c.accent, badge: "Moderate", level: "moderate" };

  const diffEmi = displayScenarioEmi - displayEmi;
  const diffInterest = displayScenarioInterest - displayTotalInterest;

  return (
    <div className="fade" style={{ width: "100%", maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: c.primary, fontSize: 12, fontWeight: 850, letterSpacing: 0.8, textTransform: "uppercase" }}>
          FINANCIAL SIMULATOR & READINESS
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: "6px 0 8px", color: c.text }}>
          Loan EMI & What-If Estimator
        </h1>
        <p style={{ color: c.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Calculate monthly repayment installments, simulate alternative loan scenarios, and assess cashflow readiness for <strong>{schemeName}</strong>.
        </p>
      </div>

      {/* Scheme Financial Parameter Ribbon */}
      <div
        className="glass"
        style={{
          borderRadius: 20,
          padding: "16px 22px",
          marginBottom: 24,
          background: `${c.primary}0a`,
          border: `1.5px solid ${c.primary}25`,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: c.muted, fontWeight: 800, textTransform: "uppercase" }}>
            Maximum Scheme Ceiling
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: c.primary, marginTop: 2 }}>
            {schemeMaxLoan ? formatCurrency(schemeMaxLoan) : "Not specified"}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: c.muted, fontWeight: 800, textTransform: "uppercase" }}>
            Applicable Interest Rate
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginTop: 2 }}>
            {interestRate}% <span style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>p.a.</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: c.muted, fontWeight: 800, textTransform: "uppercase" }}>
            Standard Repayment Tenure
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginTop: 2 }}>
            Up to 7 Years (84 Months)
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: c.muted, fontWeight: 800, textTransform: "uppercase" }}>
            Moratorium / Grace Period
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: c.text, marginTop: 2 }}>
            Up to 18 Months (where supported)
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 24,
          borderBottom: `1px solid ${c.border}`,
          paddingBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("calculator")}
          style={{
            border: "none",
            background: activeTab === "calculator" ? c.primary : c.surface2,
            color: activeTab === "calculator" ? "white" : c.text,
            padding: "10px 20px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            boxShadow: activeTab === "calculator" ? `0 4px 14px ${c.primary}40` : "none",
          }}
        >
          <Calculator size={16} />
          1. EMI Calculator
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("whatif")}
          style={{
            border: "none",
            background: activeTab === "whatif" ? c.primary : c.surface2,
            color: activeTab === "whatif" ? "white" : c.text,
            padding: "10px 20px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            boxShadow: activeTab === "whatif" ? `0 4px 14px ${c.primary}40` : "none",
          }}
        >
          <Sliders size={16} />
          2. What-If Simulator
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("readiness")}
          style={{
            border: "none",
            background: activeTab === "readiness" ? c.primary : c.surface2,
            color: activeTab === "readiness" ? "white" : c.text,
            padding: "10px 20px",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            boxShadow: activeTab === "readiness" ? `0 4px 14px ${c.primary}40` : "none",
          }}
        >
          <ShieldCheck size={16} />
          3. Financial Readiness
        </button>
      </div>

      {/* TAB 1: EMI Calculator */}
      {activeTab === "calculator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
          {/* Controls Column */}
          <div className="glass" style={{ borderRadius: 22, padding: 26 }}>
            <h2 style={{ fontSize: 20, fontWeight: 850, margin: "0 0 20px" }}>
              Loan Parameters
            </h2>

            {/* Scheme Limit Warning Banner */}
            {exceedsLimit && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: `${c.danger}15`,
                  border: `1px solid ${c.danger}40`,
                  color: c.danger,
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <AlertTriangle size={18} />
                <div>
                  Requested loan ({formatCurrency(loanAmount)}) exceeds the configured scheme maximum ({formatCurrency(schemeMaxLoan)}).
                </div>
              </div>
            )}

            {/* Loan Amount Slider */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: c.text }}>
                  Requested Loan Amount
                </label>
                <span style={{ fontSize: 18, fontWeight: 900, color: exceedsLimit ? c.danger : c.primary, fontFamily: "monospace" }}>
                  {formatCurrency(loanAmount)}
                </span>
              </div>
              <input
                type="range"
                min={25000}
                max={schemeMaxLoan ? Math.max(schemeMaxLoan, 2000000) : 5000000}
                step={25000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                style={{ width: "100%", accentColor: c.primary, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.muted, marginTop: 4 }}>
                <span>Rs. 25,000</span>
                <span>{formatCurrency(schemeMaxLoan ? Math.max(schemeMaxLoan, 2000000) : 5000000)}</span>
              </div>
            </div>

            {/* Interest Rate Slider */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: c.text }}>
                  Annual Interest Rate (% p.a.)
                </label>
                <span style={{ fontSize: 18, fontWeight: 900, color: c.text, fontFamily: "monospace" }}>
                  {interestRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={18}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: c.primary, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.muted, marginTop: 4 }}>
                <span>0% (Concessional)</span>
                <span>18%</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div style={{ marginBottom: 15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: c.text }}>
                  Loan Tenure (Years)
                </label>
                <span style={{ fontSize: 18, fontWeight: 900, color: c.text, fontFamily: "monospace" }}>
                  {tenureYears} Years ({tenureYears * 12} Months)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                style={{ width: "100%", accentColor: c.primary, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: c.muted, marginTop: 4 }}>
                <span>1 Year</span>
                <span>15 Years</span>
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div style={{ display: "grid", gap: 16 }}>
            <div
              className="glass"
              style={{
                borderRadius: 22,
                padding: 26,
                background: `${c.primary}08`,
                border: `1.5px solid ${c.primary}30`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Indicative Financial Estimate
              </div>

              {/* Monthly EMI Focus */}
              <div style={{ marginTop: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: c.muted, fontWeight: 700 }}>MONTHLY EMI</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: c.primary, letterSpacing: -0.5, marginTop: 2 }}>
                  {formatCurrency(displayEmi)}
                  <span style={{ fontSize: 14, fontWeight: 700, color: c.muted, marginLeft: 6 }}>/ month</span>
                </div>
              </div>

              {/* Repayment Breakdown Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  paddingTop: 16,
                  borderTop: `1px solid ${c.border}`,
                  marginBottom: 18,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>PRINCIPAL BORROWED</div>
                  <div style={{ fontSize: 17, fontWeight: 850, marginTop: 3 }}>{formatCurrency(loanAmount)}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>TOTAL INTEREST</div>
                  <div style={{ fontSize: 17, fontWeight: 850, color: c.accent, marginTop: 3 }}>
                    {formatCurrency(displayTotalInterest)}
                  </div>
                </div>

                <div style={{ gridColumn: "span 2", paddingTop: 8, borderTop: `1px dashed ${c.border}` }}>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>TOTAL REPAYMENT AMOUNT</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: c.text, marginTop: 3 }}>
                    {formatCurrency(displayTotalRepayment)}
                  </div>
                </div>
              </div>

              {/* Progress Proportion Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 5 }}>
                  <span style={{ color: c.primary }}>Principal ({Math.round((loanAmount / (displayTotalRepayment || 1)) * 100)}%)</span>
                  <span style={{ color: c.accent }}>Interest ({Math.round((displayTotalInterest / (displayTotalRepayment || 1)) * 100)}%)</span>
                </div>
                <div style={{ width: "100%", height: 8, borderRadius: 4, background: c.surface2, overflow: "hidden", display: "flex" }}>
                  <div
                    style={{
                      width: `${(loanAmount / (displayTotalRepayment || 1)) * 100}%`,
                      background: c.primary,
                      height: "100%",
                    }}
                  />
                  <div
                    style={{
                      width: `${(displayTotalInterest / (displayTotalRepayment || 1)) * 100}%`,
                      background: c.accent,
                      height: "100%",
                    }}
                  />
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ fontSize: 11, color: c.muted, marginTop: 18, lineHeight: 1.5 }}>
                ℹ️ <em>Indicative financial estimate for educational planning. Final loan sanction, margin money subsidy, and applicable interest concessions are evaluated by the authorized Channel Partner.</em>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTab("whatif")}
                style={{
                  border: `1px solid ${c.border}`,
                  borderRadius: 14,
                  padding: "13px 19px",
                  background: c.surface,
                  color: c.text,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <Sliders size={16} />
                Test What-If Scenarios
              </button>

              {onHandoff && (
                <button
                  type="button"
                  onClick={() =>
                    onHandoff({
                      loanAmount,
                      interestRate,
                      tenureYears,
                      monthlyEmi: displayEmi,
                      totalRepayment: displayTotalRepayment,
                    })
                  }
                  style={{
                    border: "none",
                    borderRadius: 14,
                    padding: "14px 21px",
                    background: `linear-gradient(135deg, ${c.primary}, ${c.primaryDark})`,
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: `0 12px 25px ${c.primary}35`,
                  }}
                >
                  <ArrowRight size={16} />
                  Proceed to Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: What-If Simulator */}
      {activeTab === "whatif" && (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Side-by-Side Comparison Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Scenario A: Baseline */}
            <div className="glass" style={{ borderRadius: 22, padding: 24, border: `1.5px solid ${c.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ padding: "3px 10px", borderRadius: 8, background: `${c.primary}18`, color: c.primary, fontWeight: 900, fontSize: 12 }}>
                  SCENARIO A (BASE)
                </span>
                <span style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>Current Selection</span>
              </div>

              <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>LOAN AMOUNT</div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{formatCurrency(loanAmount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>TENURE & RATE</div>
                  <div style={{ fontSize: 14, fontWeight: 750 }}>{tenureYears} Years @ {interestRate}%</div>
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 14, background: c.surface2 }}>
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>MONTHLY EMI</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: c.primary, marginTop: 2 }}>
                  {formatCurrency(displayEmi)}
                </div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
                  Total Interest: {formatCurrency(displayTotalInterest)}
                </div>
              </div>
            </div>

            {/* Scenario B: Alternative What-If */}
            <div className="glass" style={{ borderRadius: 22, padding: 24, border: `1.5px solid ${c.accent}40`, background: `${c.accent}05` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ padding: "3px 10px", borderRadius: 8, background: `${c.accent}20`, color: c.accent, fontWeight: 900, fontSize: 12 }}>
                  SCENARIO B (WHAT-IF)
                </span>
                <span style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>Alternative Simulation</span>
              </div>

              {/* Interactive Sliders for Scenario B */}
              <div style={{ display: "grid", gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}>
                    <span>Loan Amount</span>
                    <span style={{ color: c.accent }}>{formatCurrency(scenarioLoan)}</span>
                  </div>
                  <input
                    type="range"
                    min={25000}
                    max={schemeMaxLoan ? Math.max(schemeMaxLoan, 2000000) : 5000000}
                    step={25000}
                    value={scenarioLoan}
                    onChange={(e) => setScenarioLoan(Number(e.target.value))}
                    style={{ width: "100%", accentColor: c.accent }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800 }}>
                    <span>Tenure (Years)</span>
                    <span style={{ color: c.accent }}>{scenarioTenure} Years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={1}
                    value={scenarioTenure}
                    onChange={(e) => setScenarioTenure(Number(e.target.value))}
                    style={{ width: "100%", accentColor: c.accent }}
                  />
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 14, background: c.surface2 }}>
                <div style={{ fontSize: 11, color: c.muted, fontWeight: 700 }}>MONTHLY EMI</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: c.accent, marginTop: 2 }}>
                  {formatCurrency(displayScenarioEmi)}
                </div>
                <div style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
                  Total Interest: {formatCurrency(displayScenarioInterest)}
                </div>
              </div>
            </div>
          </div>

          {/* Delta Narrative Callout */}
          <div
            className="glass"
            style={{
              padding: "18px 24px",
              borderRadius: 18,
              background: diffEmi < 0 ? `${c.success}10` : `${c.accent}10`,
              border: `1.5px solid ${diffEmi < 0 ? c.success : c.accent}35`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: diffEmi < 0 ? c.success : c.accent,
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {diffEmi < 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: diffEmi < 0 ? c.success : c.accent }}>
                  Scenario Impact Analysis
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: c.text, marginTop: 2 }}>
                  {diffEmi < 0 ? (
                    <>
                      Scenario B <strong>reduces monthly EMI by {formatCurrency(Math.abs(diffEmi))}</strong> ({Math.abs(Math.round((diffEmi / (displayEmi || 1)) * 100))}%), with {diffInterest < 0 ? `a total interest saving of ${formatCurrency(Math.abs(diffInterest))}` : `an additional interest of ${formatCurrency(diffInterest)} due to longer tenure`}.
                    </>
                  ) : (
                    <>
                      Scenario B <strong>increases monthly EMI by {formatCurrency(diffEmi)}</strong> (+{Math.round((diffEmi / (displayEmi || 1)) * 100)}%), with {diffInterest >= 0 ? `an additional total interest of ${formatCurrency(diffInterest)}` : `an interest saving of ${formatCurrency(Math.abs(diffInterest))}`}.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Financial Readiness */}
      {activeTab === "readiness" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "start" }}>
          {/* Income & Expenses Input */}
          <div className="glass" style={{ borderRadius: 22, padding: 26 }}>
            <h2 style={{ fontSize: 20, fontWeight: 850, margin: "0 0 16px" }}>
              Applicant Cashflow Inputs
            </h2>
            <p style={{ fontSize: 13, color: c.muted, marginBottom: 20 }}>
              Enter your monthly household cashflows to assess whether the proposed EMI fits comfortably within your safety buffer.
            </p>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 800, display: "block", marginBottom: 6 }}>
                  Monthly Business / Household Income
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${c.border}`,
                    background: c.surface,
                    color: c.text,
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800, display: "block", marginBottom: 6 }}>
                  Monthly Household Living Expenses
                </label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${c.border}`,
                    background: c.surface,
                    color: c.text,
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 800, display: "block", marginBottom: 6 }}>
                  Existing Monthly Loans / EMI Obligations
                </label>
                <input
                  type="number"
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(Math.max(0, Number(e.target.value)))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${c.border}`,
                    background: c.surface,
                    color: c.text,
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Assessment Result Card */}
          <div
            className="glass"
            style={{
              borderRadius: 22,
              padding: 26,
              background: readinessStatus.level === "comfortable" ? `${c.success}08` : readinessStatus.level === "moderate" ? `${c.accent}08` : `${c.danger}08`,
              border: `1.5px solid ${readinessStatus.color}40`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase" }}>
                REPAYMENT COMFORT STATUS
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "4px 12px",
                  borderRadius: 10,
                  background: `${readinessStatus.color}20`,
                  color: readinessStatus.color,
                }}
              >
                {readinessStatus.badge}
              </span>
            </div>

            <div style={{ fontSize: 22, fontWeight: 900, color: readinessStatus.color, marginBottom: 12 }}>
              {readinessStatus.label}
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: "grid", gap: 10, padding: 14, borderRadius: 14, background: c.surface, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: c.muted }}>Total Monthly Debt (Existing + New EMI):</span>
                <span style={{ fontWeight: 850 }}>{formatCurrency(totalDebt)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: c.muted }}>EMI Debt-to-Income Ratio:</span>
                <span style={{ fontWeight: 850, color: readinessStatus.color }}>{burdenPct}%</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: c.muted }}>Disposable Cashflow After All EMI:</span>
                <span style={{ fontWeight: 850, color: disposableAfter >= 0 ? c.success : c.danger }}>
                  {formatCurrency(disposableAfter)}
                </span>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.6 }}>
              <strong>Guidance:</strong>{" "}
              {readinessStatus.level === "comfortable"
                ? "Your estimated repayment burden is within comfortable institutional safety limits (<=30% of income). You are ready to proceed with document verification."
                : readinessStatus.level === "moderate"
                ? "Your repayment burden represents 30-40% of income. Consider testing a longer tenure in the What-If tab to create a wider cashflow cushion."
                : "Your total obligations exceed 40% of income or leave negative cashflow. We recommend testing a smaller loan amount or longer tenure before applying."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
