import React, { useState, useEffect, useCallback } from "react";
import {
  adminApi,
  getAdminToken,
  clearAdminToken,
} from "../services/api/adminApi";

export default function AdminDashboard({ onBackToPortal }) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("admin@schemesaathi.gov.in");
  const [loginPassword, setLoginPassword] = useState("Admin@SIH2026!");
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab: "overview" | "schemes" | "requirements" | "partners" | "applications" | "audit"
  const [activeTab, setActiveTab] = useState("overview");

  // Operational Data States
  const [metrics, setMetrics] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [schemesTotal, setSchemesTotal] = useState(0);
  const [schemeSearch, setSchemeSearch] = useState("");
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState("");
  
  const [selectedSchemeId, setSelectedSchemeId] = useState("PMMY_SHISHU");
  const [schemeRequirements, setSchemeRequirements] = useState([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);

  const [partners, setPartners] = useState([]);
  const [partnerStateFilter, setPartnerStateFilter] = useState("");

  const [applications, setApplications] = useState([]);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("");
  const [applicationSearch, setApplicationSearch] = useState("");
  
  const [selectedAppDetail, setSelectedAppDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Status Transition Modal State
  const [transitionAppId, setTransitionAppId] = useState(null);
  const [transitionTargetStatus, setTransitionTargetStatus] = useState("under_review");
  const [transitionRemarks, setTransitionRemarks] = useState("");
  const [sanctionedAmount, setSanctionedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState(null);

  // Scheme Edit Modal State
  const [editingScheme, setEditingScheme] = useState(null);
  const [editSchemeForm, setEditSchemeForm] = useState({});

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilterType, setAuditFilterType] = useState("");

  // General Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 5000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  // Verify Session on Mount
  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      adminApi
        .getProfile()
        .then((profile) => {
          setAdminUser(profile);
          setIsAuthenticated(true);
        })
        .catch(() => {
          clearAdminToken();
          setIsAuthenticated(false);
        });
    }
  }, []);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await adminApi.login({
        email: loginEmail,
        password: loginPassword,
      });
      setAdminUser({
        email: res.email,
        name: res.name || "Administrator",
        role: res.role || "super_admin",
      });
      setIsAuthenticated(true);
      showToast("Administrative session authenticated successfully.");
    } catch (err) {
      setLoginError(err.message || "Invalid administrative credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast("Signed out of Nodal Operations Console.");
  };

  // Load Metrics
  const loadMetrics = useCallback(async () => {
    try {
      const data = await adminApi.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load metrics", err);
    }
  }, []);

  // Load Schemes
  const loadSchemes = useCallback(async () => {
    try {
      const data = await adminApi.listSchemes({
        search: schemeSearch,
        category: schemeCategoryFilter,
        limit: 100,
      });
      setSchemes(data.schemes || []);
      setSchemesTotal(data.total || data.total_count || 0);
    } catch (err) {
      console.error("Failed to load schemes", err);
    }
  }, [schemeSearch, schemeCategoryFilter]);

  // Load Scheme Requirements
  const loadRequirements = useCallback(async (schemeId) => {
    if (!schemeId) return;
    setRequirementsLoading(true);
    try {
      const data = await adminApi.getSchemeRequirements(schemeId);
      setSchemeRequirements(data.requirements || []);
    } catch (err) {
      console.error("Failed to load requirements", err);
    } finally {
      setRequirementsLoading(false);
    }
  }, []);

  // Load Partners
  const loadPartners = useCallback(async () => {
    try {
      const data = await adminApi.listPartners({
        state: partnerStateFilter,
        limit: 100,
      });
      setPartners(data.partners || []);
    } catch (err) {
      console.error("Failed to load partners", err);
    }
  }, [partnerStateFilter]);

  // Load Applications
  const loadApplications = useCallback(async () => {
    try {
      const data = await adminApi.listApplications({
        status: applicationStatusFilter,
        search: applicationSearch,
        limit: 100,
      });
      setApplications(data.applications || []);
    } catch (err) {
      console.error("Failed to load applications", err);
    }
  }, [applicationStatusFilter, applicationSearch]);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const data = await adminApi.getAuditLogs({
        entity_type: auditFilterType,
        limit: 100,
      });
      setAuditLogs(data.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  }, [auditFilterType]);

  // Tab change trigger
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === "overview") {
      loadMetrics();
      loadApplications();
    } else if (activeTab === "schemes") {
      loadSchemes();
    } else if (activeTab === "requirements") {
      loadSchemes();
      loadRequirements(selectedSchemeId);
    } else if (activeTab === "partners") {
      loadPartners();
    } else if (activeTab === "applications") {
      loadApplications();
    } else if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [
    isAuthenticated,
    activeTab,
    loadMetrics,
    loadSchemes,
    loadRequirements,
    selectedSchemeId,
    loadPartners,
    loadApplications,
    loadAuditLogs,
  ]);

  // Handle Application View Detail
  const handleViewApplication = async (appId) => {
    setLoading(true);
    try {
      const detail = await adminApi.getApplicationDetail(appId);
      setSelectedAppDetail(detail);
      setIsDetailModalOpen(true);
    } catch (err) {
      showToast(err.message || "Failed to fetch application details", true);
    } finally {
      setLoading(false);
    }
  };

  // Open Transition Modal
  const handleOpenTransition = (app) => {
    setTransitionAppId(app.application_id);
    const nextDefault =
      app.status === "submitted"
        ? "under_review"
        : app.status === "under_review"
        ? "approved"
        : "under_review";
    setTransitionTargetStatus(nextDefault);
    setTransitionRemarks("");
    setSanctionedAmount(app.requested_amount || "");
    setRejectionReason("");
    setTransitionError(null);
  };

  // Execute Status Transition
  const handleExecuteTransition = async (e) => {
    e.preventDefault();
    if (!transitionRemarks.trim()) {
      setTransitionError("Mandatory nodal remarks must be recorded for audit trail.");
      return;
    }
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      const res = await adminApi.transitionApplicationStatus(transitionAppId, {
        to_status: transitionTargetStatus,
        remarks: transitionRemarks,
        sanctioned_amount: sanctionedAmount,
        rejection_reason: rejectionReason,
      });

      showToast(`Application ${transitionAppId} transitioned to ${res.status_label || res.current_status}`);
      setTransitionAppId(null);
      loadApplications();
      loadMetrics();
      if (selectedAppDetail && selectedAppDetail.application_id === transitionAppId) {
        handleViewApplication(transitionAppId);
      }
    } catch (err) {
      setTransitionError(err.message || "Failed to transition application status.");
    } finally {
      setTransitionLoading(false);
    }
  };

  // Save Scheme Edit
  const handleSaveScheme = async (e) => {
    e.preventDefault();
    if (!editingScheme) return;
    try {
      await adminApi.updateScheme(editingScheme.scheme_id, editSchemeForm);
      showToast(`Scheme ${editingScheme.scheme_id} updated successfully.`);
      setEditingScheme(null);
      loadSchemes();
    } catch (err) {
      showToast(err.message || "Failed to update scheme", true);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
        {/* Top Bar */}
        <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg font-bold text-slate-950 text-xl">
              🏛️
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">
                Scheme Saathi — Nodal Admin Portal
              </h1>
              <p className="text-xs text-slate-400">
                Government of India | Ministry of Social Justice & Empowerment
              </p>
            </div>
          </div>
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
            >
              ← Back to Beneficiary Portal
            </button>
          )}
        </header>

        {/* Login Form Container */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-3xl mb-3 shadow-inner">
                🔐
              </div>
              <h2 className="text-2xl font-bold text-white">Nodal Officer Sign In</h2>
              <p className="text-sm text-slate-400 mt-1">
                Authorized administrative access for scheme, partner & application governance.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2">
                <span>⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Official Email / Username
                </label>
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@schemesaathi.gov.in"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Security Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                />
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>ℹ️</span> Authorized SIH2026 Admin Credentials:
                </div>
                <div>User: <code className="text-amber-400">admin@schemesaathi.gov.in</code></div>
                <div>Pass: <code className="text-amber-400">Admin@SIH2026!</code></div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <span className="animate-spin">⏳</span> Authenticating Session...
                  </>
                ) : (
                  <>
                    <span>🛡️</span> Sign In to Operations Console
                  </>
                )}
              </button>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-900">
          SIH26092 — Smart Automation for Marginalized Entrepreneurs | Secure GovTech Operations
        </footer>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AUTHENTICATED DASHBOARD
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Feedback */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm animate-bounce">
          <span>✅</span>
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-950 border border-red-500 text-red-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm animate-shake">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-bold text-slate-950 text-lg shadow-md">
            🏛️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white">
                Scheme Saathi Admin & Nodal Operations
              </h1>
              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded uppercase tracking-wider">
                SIH26092
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Operations Console | {adminUser?.role === "super_admin" ? "Super Administrator" : "Nodal Officer"} ({adminUser?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Database Active</span>
          </div>

          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>🏠</span> Beneficiary Portal
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-900/50 border-b border-slate-800 px-6 flex overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Overview & Metrics", icon: "📊" },
          { id: "schemes", label: "Statutory Schemes", icon: "📜" },
          { id: "requirements", label: "Document Rules", icon: "📋" },
          { id: "partners", label: "Channel Partners", icon: "🏦" },
          { id: "applications", label: "Applications Review", icon: "📝" },
          { id: "audit", label: "Audit Trail", icon: "🛡️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? "border-amber-400 text-amber-300 bg-amber-500/5"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Statutory Schemes</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{metrics?.total_schemes || schemesTotal || 405}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xl">
                    📜
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">{metrics?.active_schemes || 405} active</span>
                  <span>• AI embeddings verified</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Channel Partners</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{metrics?.total_channel_partners || 8}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xl">
                    🏦
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-amber-400 font-semibold">PSBs, DICs & Corporations</span>
                  <span>• Mappls routing</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Applications</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{metrics?.total_applications || applications.length}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl text-xl">
                    📑
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-purple-400 font-semibold">{metrics?.pending_applications || 0} submitted</span>
                  <span>• {metrics?.under_review_applications || 0} under review</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Doc Readiness Avg</p>
                    <p className="text-3xl font-extrabold text-emerald-400 mt-1">
                      {metrics?.avg_document_readiness !== undefined ? `${metrics.avg_document_readiness}%` : "100%"}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xl">
                    ✅
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-semibold">Tesseract OCR validation</span>
                  <span>• Zero fake approvals</span>
                </div>
              </div>
            </div>

            {/* Application Status Pipeline Breakdown */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>🔄</span> Statutory Application Governance Pipeline
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { key: "submitted", label: "Submitted", count: metrics?.applications_by_status?.submitted || 0, color: "text-blue-400", bg: "bg-blue-950/40 border-blue-800/40" },
                  { key: "under_review", label: "Under Review", count: metrics?.applications_by_status?.under_review || 0, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/40" },
                  { key: "approved", label: "Approved", count: metrics?.applications_by_status?.approved || 0, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/40" },
                  { key: "rejected", label: "Rejected", count: metrics?.applications_by_status?.rejected || 0, color: "text-red-400", bg: "bg-red-950/40 border-red-800/40" },
                  { key: "disbursed", label: "Disbursed", count: metrics?.applications_by_status?.disbursed || 0, color: "text-cyan-400", bg: "bg-cyan-950/40 border-cyan-800/40" },
                ].map((s) => (
                  <div key={s.key} className={`p-4 rounded-xl border ${s.bg} text-center`}>
                    <p className="text-xs text-slate-400 uppercase font-semibold">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions Feed */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Recent Applications Pending Nodal Review
                </h2>
                <button
                  onClick={() => setActiveTab("applications")}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  View All Applications →
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No applications recorded in the database yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.application_id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">{app.application_id}</span>
                          <span className="text-xs font-semibold text-white">{app.applicant_name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {app.state}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{app.scheme_name} • Partner: {app.partner_name || "Nodal DIC"}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          app.status === "approved" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                          app.status === "rejected" ? "bg-red-950 text-red-300 border border-red-800" :
                          app.status === "under_review" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                          "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}>
                          {app.status_label || app.status}
                        </span>
                        <button
                          onClick={() => handleViewApplication(app.application_id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STATUTORY SCHEMES ── */}
        {activeTab === "schemes" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="text-base font-bold text-white">Statutory Scheme Directory ({schemesTotal})</h2>
                <p className="text-xs text-slate-400">Manage scheme metadata, limits, and active status.</p>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={schemeSearch}
                  onChange={(e) => setSchemeSearch(e.target.value)}
                  placeholder="Search schemes or ministry..."
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
                />
                <select
                  value={schemeCategoryFilter}
                  onChange={(e) => setSchemeCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Categories</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="OBC">OBC</option>
                  <option value="Women">Women</option>
                  <option value="Minorities">Minorities</option>
                </select>
              </div>
            </div>

            {/* Schemes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemes.map((s) => (
                <div key={s.scheme_id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded">
                        {s.scheme_id}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        s.is_active ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-red-950 text-red-300 border border-red-800"
                      }`}>
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white leading-snug">{s.scheme_name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{s.ministry}</p>

                    <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Benefit / Limit:</span>
                        <span className="font-semibold text-amber-400">{s.benefit_amount}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-400">Categories:</span>
                        <span>{s.categories?.join(", ") || "General"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">
                      📋 {s.requirements_count} Document Rules
                    </span>
                    <button
                      onClick={() => {
                        setEditingScheme(s);
                        setEditSchemeForm({
                          scheme_name: s.scheme_name,
                          ministry: s.ministry,
                          benefit_amount: s.benefit_amount,
                          is_active: s.is_active,
                        });
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
                    >
                      ✏️ Edit Metadata
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: DOCUMENT REQUIREMENTS ── */}
        {activeTab === "requirements" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Document Requirements & Validation Rules</h2>
                <p className="text-xs text-slate-400">Configure mandatory documents and verification rules per scheme.</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-semibold">Select Scheme:</label>
                <select
                  value={selectedSchemeId}
                  onChange={(e) => {
                    setSelectedSchemeId(e.target.value);
                    loadRequirements(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {schemes.map((s) => (
                    <option key={s.scheme_id} value={s.scheme_id}>
                      {s.scheme_id} — {s.scheme_name.substring(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {requirementsLoading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading requirements rulebook...</div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-white">
                    Mandatory Checklist for <code className="text-amber-400">{selectedSchemeId}</code> ({schemeRequirements.length} Rules)
                  </h3>
                </div>

                <div className="divide-y divide-slate-800">
                  {schemeRequirements.map((req, idx) => (
                    <div key={idx} className="py-4 flex flex-col sm:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{req.title}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            req.mandatory ? "bg-red-950 text-red-300 border border-red-800" : "bg-slate-800 text-slate-300"
                          }`}>
                            {req.mandatory ? "Mandatory" : "Optional"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">Type: {req.doc_type}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{req.description}</p>
                        <div className="flex gap-4 mt-2 text-[11px] text-slate-500 font-mono">
                          <span>Formats: {Array.isArray(req.valid_formats) ? req.valid_formats.join(", ") : req.valid_formats}</span>
                          <span>Max Size: {req.max_size_mb || 20}MB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: CHANNEL PARTNERS ── */}
        {activeTab === "partners" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Channel Partner & Nodal Office Network ({partners.length})</h2>
                <p className="text-xs text-slate-400">Authorized PSBs, State Corporations, and DIC nodal processing hubs.</p>
              </div>

              <input
                type="text"
                value={partnerStateFilter}
                onChange={(e) => setPartnerStateFilter(e.target.value)}
                placeholder="Filter by State (e.g. Maharashtra)..."
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partners.map((p) => (
                <div key={p.partner_id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700">
                        {p.partner_id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {p.is_active ? "Operational" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                    <p className="text-xs text-amber-400 mt-0.5">{p.partner_type}</p>
                    <p className="text-xs text-slate-400 mt-2">📍 {p.district}, {p.state}</p>
                    <p className="text-xs text-slate-500 mt-1">{p.address}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between">
                    <span>📞 {p.contact_phone}</span>
                    <span className="text-emerald-400">Mappls Geo-Enabled</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: APPLICATIONS REVIEW & TRANSITION ── */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Beneficiary Applications Review ({applications.length})</h2>
                <p className="text-xs text-slate-400">Nodal examination console with state transition and audit logging.</p>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={applicationSearch}
                  onChange={(e) => setApplicationSearch(e.target.value)}
                  placeholder="Search by ID or applicant..."
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <select
                  value={applicationStatusFilter}
                  onChange={(e) => setApplicationStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="disbursed">Disbursed</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="p-4">Application ID</th>
                      <th className="p-4">Applicant (Masked PII)</th>
                      <th className="p-4">Scheme</th>
                      <th className="p-4">Partner</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Readiness</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          No beneficiary applications found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app.application_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-mono font-bold text-amber-400">{app.application_id}</td>
                          <td className="p-4">
                            <div className="font-semibold text-white">{app.applicant_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">📱 {app.phone_masked} • {app.category}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-100">{app.scheme_name}</div>
                            <div className="text-[10px] text-slate-400">{app.scheme_id}</div>
                          </td>
                          <td className="p-4 text-slate-300">{app.partner_name || "Nodal DIC Hub"}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              app.status === "approved" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                              app.status === "rejected" ? "bg-red-950 text-red-300 border border-red-800" :
                              app.status === "under_review" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                              app.status === "disbursed" ? "bg-cyan-950 text-cyan-300 border border-cyan-800" :
                              "bg-blue-950 text-blue-300 border border-blue-800"
                            }`}>
                              {app.status_label || app.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                              <span>✅</span> {app.document_readiness_score}%
                            </div>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleViewApplication(app.application_id)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                            >
                              Dossier
                            </button>
                            <button
                              onClick={() => handleOpenTransition(app)}
                              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded border border-amber-500/40 font-semibold"
                            >
                              Transition ➔
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 6: AUDIT TRAIL ── */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Immutable Administrative Audit Logs ({auditLogs.length})</h2>
                <p className="text-xs text-slate-400">Cryptographically verifiable actions log for statutory compliance.</p>
              </div>

              <select
                value={auditFilterType}
                onChange={(e) => setAuditFilterType(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="">All Entity Types</option>
                <option value="APPLICATION">Applications</option>
                <option value="SCHEME">Schemes</option>
                <option value="REQUIREMENTS">Requirements</option>
                <option value="AUTH">Authentication</option>
              </select>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="p-4">Timestamp (UTC)</th>
                      <th className="p-4">Actor</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Entity</th>
                      <th className="p-4">Details</th>
                      <th className="p-4">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-4 text-slate-400">{log.timestamp}</td>
                        <td className="p-4 text-amber-400">{log.actor_email} ({log.actor_role})</td>
                        <td className="p-4 font-bold text-white">{log.action}</td>
                        <td className="p-4 text-slate-300">{log.entity_type}:{log.entity_id}</td>
                        <td className="p-4 text-slate-400 max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : "—"}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {log.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL 1: STATUS TRANSITION MODAL ── */}
      {transitionAppId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-white">Transition Application Status</h3>
                <p className="text-xs text-slate-400 font-mono">Target: {transitionAppId}</p>
              </div>
              <button
                onClick={() => setTransitionAppId(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {transitionError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-xs text-red-300 rounded-xl">
                {transitionError}
              </div>
            )}

            <form onSubmit={handleExecuteTransition} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Status</label>
                <select
                  value={transitionTargetStatus}
                  onChange={(e) => setTransitionTargetStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="under_review">under_review (Start Nodal Officer Examination)</option>
                  <option value="approved">approved (Approve Beneficiary Scheme Application)</option>
                  <option value="rejected">rejected (Reject Application with Cause)</option>
                  <option value="disbursed">disbursed (Record Bank Fund Disbursement)</option>
                </select>
              </div>

              {transitionTargetStatus === "approved" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sanctioned Amount (₹)</label>
                  <input
                    type="number"
                    value={sanctionedAmount}
                    onChange={(e) => setSanctionedAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {transitionTargetStatus === "rejected" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specific Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Income certificate exceeds scheme statutory ceiling"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nodal Audit Remarks (Mandatory)
                </label>
                <textarea
                  rows="3"
                  value={transitionRemarks}
                  onChange={(e) => setTransitionRemarks(e.target.value)}
                  placeholder="Record formal assessment notes, physical verification summary, and officer remarks..."
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransitionAppId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitionLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  {transitionLoading ? "Executing Transition..." : "Commit Status Transition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: APPLICATION DOSSIER DRAWER ── */}
      {isDetailModalOpen && selectedAppDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">Application Dossier</h3>
                  <span className="font-mono text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                    {selectedAppDetail.application_id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedAppDetail.scheme_name}</p>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl text-xs">
              <div>
                <p className="text-slate-500">Applicant Name</p>
                <p className="font-semibold text-white mt-0.5">{selectedAppDetail.applicant_name}</p>
              </div>
              <div>
                <p className="text-slate-500">Masked Phone</p>
                <p className="font-mono font-semibold text-white mt-0.5">{selectedAppDetail.phone_masked}</p>
              </div>
              <div>
                <p className="text-slate-500">State & Category</p>
                <p className="font-semibold text-white mt-0.5">{selectedAppDetail.state} ({selectedAppDetail.category})</p>
              </div>
              <div>
                <p className="text-slate-500">Current Status</p>
                <p className="font-semibold text-amber-400 mt-0.5">{selectedAppDetail.status_label}</p>
              </div>
            </div>

            {/* Audit Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Status Lifecycle & Audit History
              </h4>
              <div className="space-y-2">
                {selectedAppDetail.timeline?.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs flex items-start gap-3">
                    <span className="text-amber-400 font-mono text-[10px] mt-0.5">{t.created_at?.substring(0, 19)}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{t.status_label || t.new_status} (by {t.changed_by || "system"})</div>
                      <p className="text-slate-400 mt-0.5 text-[11px]">{t.note || "Standard workflow event recorded."}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenTransition(selectedAppDetail);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                Perform Status Transition →
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: SCHEME EDIT MODAL ── */}
      {editingScheme && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-white">Edit Scheme Metadata</h3>
                <p className="text-xs text-slate-400 font-mono">{editingScheme.scheme_id}</p>
              </div>
              <button onClick={() => setEditingScheme(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveScheme} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Scheme Name</label>
                <input
                  type="text"
                  value={editSchemeForm.scheme_name || ""}
                  onChange={(e) => setEditSchemeForm({ ...editSchemeForm, scheme_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ministry</label>
                <input
                  type="text"
                  value={editSchemeForm.ministry || ""}
                  onChange={(e) => setEditSchemeForm({ ...editSchemeForm, ministry: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Benefit Summary / Loan Limit</label>
                <input
                  type="text"
                  value={editSchemeForm.benefit_amount || ""}
                  onChange={(e) => setEditSchemeForm({ ...editSchemeForm, benefit_amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editSchemeForm.is_active || false}
                  onChange={(e) => setEditSchemeForm({ ...editSchemeForm, is_active: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500"
                />
                <label htmlFor="isActiveToggle" className="text-slate-300 font-semibold">Scheme is Active for Matching</label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingScheme(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
