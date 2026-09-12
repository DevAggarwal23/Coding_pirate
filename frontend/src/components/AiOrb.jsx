import React from "react";

/**
 * AiOrb Component
 * 3D-styled hardware-accelerated SVG & CSS AI Intelligence Orb.
 * Supports multi-state animations: IDLE | LISTENING | THINKING | RESPONDING | ERROR
 * Sizes: 'sm' | 'md' | 'lg' | 'hero'
 */
export function AiOrb({
  state = "IDLE", // IDLE | LISTENING | THINKING | RESPONDING | ERROR
  size = "md",   // sm | md | lg | hero
  onClick,
  className = "",
  style = {},
  showRings = true,
  interactive = false,
}) {
  const sizeMap = {
    sm: { px: 32, ringPx: 44, stroke: 1.5 },
    md: { px: 72, ringPx: 96, stroke: 2 },
    lg: { px: 130, ringPx: 165, stroke: 2.5 },
    hero: { px: 240, ringPx: 300, stroke: 3 },
  };

  const dim = sizeMap[size] || sizeMap.md;

  // Theme palettes based on state
  const statePalettes = {
    IDLE: {
      core1: "#087F5B",
      core2: "#35C59A",
      core3: "#056047",
      glow: "rgba(8, 127, 91, 0.45)",
      ringColor: "#35C59A",
      accent: "#E58B35",
      pulseSpeed: "4s",
      rotateSpeed: "16s",
    },
    LISTENING: {
      core1: "#10B981",
      core2: "#34D399",
      core3: "#047857",
      glow: "rgba(16, 185, 129, 0.75)",
      ringColor: "#6EE7B7",
      accent: "#FBBF24",
      pulseSpeed: "1.5s",
      rotateSpeed: "8s",
    },
    THINKING: {
      core1: "#3B82F6",
      core2: "#60A5FA",
      core3: "#1D4ED8",
      glow: "rgba(59, 130, 246, 0.65)",
      ringColor: "#93C5FD",
      accent: "#8B5CF6",
      pulseSpeed: "2s",
      rotateSpeed: "4s",
    },
    RESPONDING: {
      core1: "#087F5B",
      core2: "#F59E0B",
      core3: "#35C59A",
      glow: "rgba(245, 158, 11, 0.6)",
      ringColor: "#FCD34D",
      accent: "#10B981",
      pulseSpeed: "1.8s",
      rotateSpeed: "6s",
    },
    ERROR: {
      core1: "#EF4444",
      core2: "#F87171",
      core3: "#B91C1C",
      glow: "rgba(239, 68, 68, 0.6)",
      ringColor: "#FCA5A5",
      accent: "#DC2626",
      pulseSpeed: "5s",
      rotateSpeed: "20s",
    },
  };

  const p = statePalettes[state] || statePalettes.IDLE;

  return (
    <div
      onClick={onClick}
      className={`ai-orb-container ${className}`}
      style={{
        position: "relative",
        width: dim.ringPx,
        height: dim.ringPx,
        display: "grid",
        placeItems: "center",
        cursor: interactive ? "pointer" : "default",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Dynamic Outer Aura Glow */}
      <div
        style={{
          position: "absolute",
          width: dim.px * 1.1,
          height: dim.px * 1.1,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${p.glow} 0%, transparent 70%)`,
          filter: `blur(${dim.px * 0.18}px)`,
          transition: "all 0.5s ease",
          animation: `orbBreathing ${p.pulseSpeed} ease-in-out infinite`,
          pointerEvents: "none",
        }}
      />

      {/* Orbital Concentric Ring */}
      {showRings && (
        <svg
          width={dim.ringPx}
          height={dim.ringPx}
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            animation: `orbRotate ${p.rotateSpeed} linear infinite`,
            pointerEvents: "none",
          }}
        >
          <ellipse
            cx="50"
            cy="50"
            rx="46"
            ry="24"
            fill="none"
            stroke={p.ringColor}
            strokeWidth={dim.stroke}
            strokeDasharray="8 6 3 6"
            strokeOpacity="0.65"
            transform="rotate(-25 50 50)"
          />
          <circle
            cx="88"
            cy="36"
            r="3"
            fill={p.accent}
            style={{ filter: "drop-shadow(0 0 4px #FFF)" }}
          />
        </svg>
      )}

      {/* 3D Gradient Sphere */}
      <svg
        width={dim.px}
        height={dim.px}
        viewBox="0 0 100 100"
        style={{
          borderRadius: "50%",
          boxShadow: `0 8px 24px ${p.glow}`,
          transition: "transform 0.3s ease, filter 0.3s ease",
          animation: `floatSmooth 4s ease-in-out infinite`,
        }}
      >
        <defs>
          <radialGradient id={`coreGrad-${state}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="25%" stopColor={p.core2} />
            <stop offset="70%" stopColor={p.core1} />
            <stop offset="100%" stopColor={p.core3} />
          </radialGradient>
          <linearGradient id={`specular-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Main Sphere Body */}
        <circle cx="50" cy="50" r="48" fill={`url(#coreGrad-${state})`} />

        {/* Specular 3D Reflection Highlight */}
        <ellipse cx="42" cy="30" rx="22" ry="12" fill="white" opacity="0.35" transform="rotate(-15 42 30)" />

        {/* Inner Radial Energy Pattern */}
        <circle cx="50" cy="50" r="36" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}
