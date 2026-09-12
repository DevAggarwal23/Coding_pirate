import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, ChevronRight, Loader2 } from "lucide-react";

/**
 * Standard Surface Card
 */
export function Card({
  children,
  c,
  className = "",
  style = {},
  onClick,
  hoverable = false,
  padding = 24,
}) {
  return (
    <div
      onClick={onClick}
      className={`glass ${hoverable ? "float-hover" : ""} ${className}`}
      style={{
        borderRadius: 20,
        padding,
        background: c?.surface || "#FFFFFF",
        border: `1px solid ${c?.border || "#E2E8F0"}`,
        boxShadow: c?.shadow || "0 4px 16px rgba(15, 23, 42, 0.06)",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Metric KPI Stat Card
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  c,
  badge = null,
  trend = null,
  style = {},
}) {
  return (
    <Card c={c} style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: c?.muted || "#64748B", fontSize: 13, fontWeight: 700 }}>
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${c?.primary || "#087F5B"}15`,
              color: c?.primary || "#087F5B",
              display: "grid",
              placeItems: "center",
            }}
          >
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 850, color: c?.text || "#0F172A", letterSpacing: -0.5 }}>
        {value}
      </div>
      {(subtitle || badge || trend) && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: c?.muted || "#64748B" }}>
          {badge}
          {trend && <span style={{ color: c?.success || "#10B981", fontWeight: 700 }}>{trend}</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}

/**
 * Semantic Status Badge
 */
export function StatusBadge({ status, c, size = "md" }) {
  const statusConfig = {
    draft: { label: "Draft", color: "#64748B", bg: "rgba(100, 116, 139, 0.12)", icon: <Clock size={12} /> },
    documents_pending: { label: "Docs Pending", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", icon: <AlertTriangle size={12} /> },
    ready_for_submission: { label: "Ready to Submit", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)", icon: <CheckCircle2 size={12} /> },
    submitted: { label: "Submitted", color: "#087F5B", bg: "rgba(8, 127, 91, 0.12)", icon: <CheckCircle2 size={12} /> },
    under_review: { label: "Under Review", color: "#6366F1", bg: "rgba(99, 102, 241, 0.12)", icon: <Clock size={12} /> },
    action_required: { label: "Action Required", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.14)", icon: <AlertTriangle size={12} /> },
    approved: { label: "Approved by Nodal", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", icon: <CheckCircle2 size={12} /> },
    rejected: { label: "Rejected", color: "#EF4444", bg: "rgba(239, 68, 68, 0.14)", icon: <XCircle size={12} /> },
    disbursed: { label: "Disbursed", color: "#059669", bg: "rgba(5, 150, 105, 0.18)", icon: <CheckCircle2 size={12} /> },
  };

  const cfg = statusConfig[status] || {
    label: status || "Unknown",
    color: "#64748B",
    bg: "rgba(100, 116, 139, 0.12)",
    icon: <Clock size={12} />,
  };

  const pad = size === "sm" ? "3px 8px" : "5px 12px";
  const fSize = size === "sm" ? 11 : 12;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        fontWeight: 750,
        fontSize: fSize,
        border: `1px solid ${cfg.color}30`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/**
 * Animated Linear Progress Bar
 */
export function ProgressBar({ value = 0, max = 100, c, height = 8, label = null }) {
  const pct = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, fontWeight: 700, color: c?.muted }}>
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        style={{
          width: "100%",
          height,
          borderRadius: 10,
          background: c?.surface2 || "#E2E8F0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 10,
            background: `linear-gradient(90deg, ${c?.primary || "#087F5B"}, ${c?.accent || "#E58B35"})`,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

/**
 * Beneficiary Journey Stepper Bar
 */
export function JourneyStepper({ currentStep = 0, steps = [], c }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "16px 20px",
        borderRadius: 16,
        background: c?.surface || "#FFFFFF",
        border: `1px solid ${c?.border || "#E2E8F0"}`,
        marginBottom: 24,
        overflowX: "auto",
        gap: 12,
      }}
    >
      {steps.map((s, idx) => {
        const isDone = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <React.Fragment key={s.label || idx}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isDone
                    ? c?.primary || "#087F5B"
                    : isCurrent
                    ? `${c?.primary || "#087F5B"}20`
                    : c?.surface2 || "#F1F5F3",
                  color: isDone
                    ? "#FFFFFF"
                    : isCurrent
                    ? c?.primary || "#087F5B"
                    : c?.muted || "#64748B",
                  border: isCurrent ? `2px solid ${c?.primary || "#087F5B"}` : "none",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {isDone ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  fontWeight: isCurrent ? 850 : isDone ? 700 : 550,
                  color: isCurrent ? c?.text || "#0F172A" : isDone ? c?.primary || "#087F5B" : c?.muted || "#64748B",
                }}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight
                size={16}
                style={{
                  color: isDone ? c?.primary || "#087F5B" : c?.border || "#CBD5E1",
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Shimmer Loading Skeleton
 */
export function LoadingSkeleton({ height = 40, width = "100%", borderRadius = 10, style = {} }) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        height,
        width,
        borderRadius,
        ...style,
      }}
    />
  );
}

/**
 * Reusable Empty State Box
 */
export function EmptyStateView({ title, description, action = null, icon = null, c }) {
  return (
    <div
      style={{
        padding: "48px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `${c?.primary || "#087F5B"}12`,
            color: c?.primary || "#087F5B",
            display: "grid",
            placeItems: "center",
            marginBottom: 6,
          }}
        >
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: 18, fontWeight: 800, color: c?.text || "#0F172A", margin: 0 }}>
        {title}
      </h3>
      <p style={{ color: c?.muted || "#64748B", fontSize: 13.5, maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
