import type React from "react"

export const glassStyle: React.CSSProperties = {
  background: "rgba(255, 215, 0, 0.03)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 215, 0, 0.08)",
}

export const glassCardStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255, 215, 0, 0.12)",
  boxShadow: "0 4px 24px -1px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 215, 0, 0.05) inset",
}

export const glowGoldStyle: React.CSSProperties = {
  boxShadow: "0 0 20px rgba(255, 215, 0, 0.25), 0 0 40px rgba(255, 215, 0, 0.15), 0 0 60px rgba(255, 215, 0, 0.05)",
}

export const glowGoldSubtleStyle: React.CSSProperties = {
  boxShadow: "0 0 30px rgba(255, 215, 0, 0.12)",
}

export const textGradientGoldStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffd700 0%, #ffa500 50%, #ffd700 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}

export const textGradientSilverStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #ffffff 0%, #a0a0a0 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}

export const gradientMeshStyle: React.CSSProperties = {
  background: `
    radial-gradient(ellipse at 20% 30%, rgba(255, 215, 0, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(255, 165, 0, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(255, 215, 0, 0.03) 0%, transparent 70%)
  `,
}
