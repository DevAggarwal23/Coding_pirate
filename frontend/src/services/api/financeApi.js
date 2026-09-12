/**
/**
 * Finance, Advisory, Channel Partner, and Document Readiness API.
 * Connects to:
 * - POST /api/finance/calculate-emi
 * - GET  /api/finance/partners
 * - POST /api/finance/document-readiness
 */
import { apiClient } from "./client.js";

/**
 * Calculates monthly EMI, interest, and total repayment breakdown.
 * @param {{
 *   principal: number,
 *   annual_interest_rate?: number,
 *   tenure_months?: number,
 *   scheme_id?: string
 * }} params
 * @returns {Promise<{
 *   principal: number,
 *   annual_interest_rate: number,
 *   tenure_months: number,
 *   monthly_emi: number,
 *   total_interest: number,
 *   total_repayment: number,
 *   principal_percentage: number,
 *   interest_percentage: number,
 *   is_valid: boolean,
 *   message?: string,
 *   scheme_id?: string,
 *   scheme_max_limit?: number,
 *   exceeds_scheme_limit?: boolean
 * }>}
 */
export async function calculateEmi(params) {
  const payload = {
    principal: Number(params.principal || params.loan_amount) || 0,
    annual_interest_rate: params.annual_interest_rate !== undefined ? Number(params.annual_interest_rate) : (params.interest_rate !== undefined ? Number(params.interest_rate) : 8.5),
    tenure_months: Number(params.tenure_months || (params.tenure_years ? params.tenure_years * 12 : 60)) || 60,
    scheme_id: params.scheme_id || null,
  };
  return apiClient.post("/api/finance/calculate-emi", payload);
}

/**
 * Retrieves recommended nodal channel partners (Banks, DIC, State Corporations).
 * @param {{ scheme_id?: string, state?: string }} params
 * @returns {Promise<{
 *   scheme_id: string|null,
 *   state: string|null,
 *   total_partners: number,
 *   disclaimer: string,
 *   partners: Array<{
 *     partner_id: string,
 *     partner_name: string,
 *     partner_type: string,
 *     location: string,
 *     state: string,
 *     supported_schemes: string[],
 *     reason: string,
 *     contact: string,
 *     data_status: string
 *   }>
 * }>}
 */
export async function getRecommendedPartners(params = {}) {
  const query = new URLSearchParams();
  if (params.scheme_id) query.append("scheme_id", params.scheme_id);
  if (params.state) query.append("state", params.state);
  if (params.category) query.append("category", params.category);
  if (params.district) query.append("district", params.district);
  const qs = query.toString();
  return apiClient.get(`/api/finance/partners${qs ? `?${qs}` : ""}`);
}

/**
 * Evaluates document readiness checklist against mandatory scheme requirements.
 * @param {{
 *   scheme_id?: string,
 *   required_documents?: string[],
 *   provided_documents?: string[]
 * }} params
 * @returns {Promise<{
 *   scheme_id: string|null,
 *   required_documents: string[],
 *   provided_documents: string[],
 *   missing_documents: string[],
 *   readiness_percentage: number,
 *   is_ready_to_submit: boolean
 * }>}
 */
export async function checkDocumentReadiness(params = {}) {
  return apiClient.post("/api/finance/document-readiness", {
    scheme_id: params.scheme_id || null,
    required_documents: params.required_documents || null,
    provided_documents: params.provided_documents || [],
  });
}

/**
 * Simulates and compares Base vs What-If financial loan scenarios.
 * @param {{
 *   scheme_id?: string,
 *   base: { loan_amount?: number, principal?: number, annual_interest_rate?: number, tenure_months?: number, tenure_years?: number },
 *   scenario?: { loan_amount?: number, principal?: number, annual_interest_rate?: number, tenure_months?: number, tenure_years?: number },
 *   scenarios?: Array<object>,
 *   financial_profile?: { monthly_income?: number, monthly_expenses?: number, existing_emi?: number }
 * }} params
 * @returns {Promise<{
 *   success: boolean,
 *   scheme: { id?: string, name?: string, max_loan_amount?: number }|null,
 *   base: object,
 *   scenario: object|null,
 *   scenarios?: Array<object>,
 *   difference: {
 *     emi: number,
 *     total_interest: number,
 *     total_repayment: number,
 *     emi_percentage_change: number,
 *     interest_percentage_change: number,
 *     narrative: string
 *   }|null,
 *   disclaimer: string
 * }>}
 */
export async function simulateWhatIf(params) {
  const payload = {
    scheme_id: params.scheme_id || null,
    base: {
      loan_amount: Number(params.base?.loan_amount || params.base?.principal) || 500000,
      annual_interest_rate: params.base?.annual_interest_rate !== undefined ? Number(params.base.annual_interest_rate) : 8.5,
      tenure_months: params.base?.tenure_months ? Number(params.base.tenure_months) : (params.base?.tenure_years ? Number(params.base.tenure_years) * 12 : 60),
    },
    scenario: params.scenario ? {
      loan_amount: Number(params.scenario?.loan_amount || params.scenario?.principal) || 400000,
      annual_interest_rate: params.scenario?.annual_interest_rate !== undefined ? Number(params.scenario.annual_interest_rate) : 8.5,
      tenure_months: params.scenario?.tenure_months ? Number(params.scenario.tenure_months) : (params.scenario?.tenure_years ? Number(params.scenario.tenure_years) * 12 : 60),
    } : null,
    scenarios: params.scenarios || null,
    financial_profile: params.financial_profile || null,
  };
  return apiClient.post("/api/finance/what-if", payload);
}

/**
 * Assesses applicant financial repayment readiness based on household cashflow.
 * Educational heuristic — NOT an official loan approval, credit score, or sanction decision.
 * @param {{
 *   monthly_income?: number,
 *   monthly_household_expenses?: number,
 *   monthly_expenses?: number,
 *   existing_emi?: number,
 *   requested_loan_amount?: number,
 *   principal?: number,
 *   annual_interest_rate?: number,
 *   tenure_months?: number,
 *   scheme_id?: string
 * }} params
 * @returns {Promise<{
 *   status: string,
 *   status_label: string,
 *   metrics: {
 *     monthly_income: number|null,
 *     monthly_household_expenses: number|null,
 *     existing_emi: number,
 *     estimated_new_emi: number,
 *     total_monthly_debt: number,
 *     disposable_income_before_emi: number|null,
 *     disposable_income_after_emi: number|null,
 *     emi_burden_ratio: number|null,
 *     emi_burden_percentage: number|null
 *   },
 *   explanation: string,
 *   recommendations: string[],
 *   disclaimer: string,
 *   is_valid: boolean
 * }>}
 */
export async function assessFinancialReadiness(params) {
  const payload = {
    monthly_income: params.monthly_income !== undefined ? Number(params.monthly_income) : null,
    monthly_household_expenses: params.monthly_household_expenses !== undefined ? Number(params.monthly_household_expenses) : (params.monthly_expenses !== undefined ? Number(params.monthly_expenses) : null),
    existing_emi: Number(params.existing_emi) || 0,
    requested_loan_amount: Number(params.requested_loan_amount || params.principal) || null,
    annual_interest_rate: params.annual_interest_rate !== undefined ? Number(params.annual_interest_rate) : 8.5,
    tenure_months: Number(params.tenure_months) || 60,
    scheme_id: params.scheme_id || null,
  };
  return apiClient.post("/api/finance/readiness", payload);
}

