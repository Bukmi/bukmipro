/**
 * Bukmi Design System — v1.0.0
 *
 * Single source of truth for all design tokens.
 * These values mirror tailwind.config.ts and globals.css exactly.
 * Import from here when you need tokens in JS/TS logic (animations, charts, etc.)
 *
 * For Tailwind classes use the Tailwind tokens directly.
 * For Figma / Claude design use design-system/tokens.json.
 */

// ─────────────────────────────────────────────────────────────────────────────
// COLOR
// ─────────────────────────────────────────────────────────────────────────────

export const color = {
  /** Page background */
  graphite: "#1F1F1F",
  /** Cards, panels, raised surfaces */
  graphiteSoft: "#262626",
  /** Borders, dividers, hover overlays */
  graphiteLine: "#333333",

  /** Primary text */
  paper: "#F2F2F2",
  /** Body / secondary text */
  paperDim: "#C9C9C9",
  /** Hints, placeholders, disabled text */
  paperMute: "#8A8A8A",

  /** Brand accent — acid yellow-green */
  accent: "#E7FF52",
  /** Text on accent backgrounds */
  accentInk: "#1F1F1F",

  /** Destructive actions, validation errors */
  danger: "#FF6B6B",
  /** Confirmations, success states */
  success: "#3DDC97",
} as const;

export type ColorKey = keyof typeof color;

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    sans: "Inter, ui-sans-serif, system-ui, sans-serif",
    display: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  fontFeatures: "'ss01', 'cv11'",
  scale: {
    /** Landing hero — clamp(2.5rem → 5rem) */
    display: {
      fontSize: "clamp(2.5rem, 6vw, 5rem)",
      lineHeight: 1.02,
      letterSpacing: "-0.03em",
      fontWeight: 800,
    },
    /** Page / section titles — clamp(2rem → 3.25rem) */
    hero: {
      fontSize: "clamp(2rem, 4vw, 3.25rem)",
      lineHeight: 1.05,
      letterSpacing: "-0.02em",
      fontWeight: 800,
    },
    xl:   { fontSize: "1.25rem",  lineHeight: 1.4, fontWeight: 700 },
    lg:   { fontSize: "1.125rem", lineHeight: 1.5, fontWeight: 600 },
    base: { fontSize: "1rem",     lineHeight: 1.6, fontWeight: 400 },
    sm:   { fontSize: "0.875rem", lineHeight: 1.5, fontWeight: 400 },
    xs:   { fontSize: "0.75rem",  lineHeight: 1.4, fontWeight: 400, letterSpacing: "0.02em" },
    /** Eyebrow labels — uppercase tracking-[0.2em] */
    label:{ fontSize: "0.625rem", lineHeight: 1,   fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" as const },
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SPACING  (Tailwind default scale, px values)
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  0:    "0px",
  0.5:  "2px",
  1:    "4px",
  1.5:  "6px",
  2:    "8px",
  3:    "12px",
  4:    "16px",
  5:    "20px",
  6:    "24px",
  8:    "32px",
  10:   "40px",
  12:   "48px",
  16:   "64px",
  20:   "80px",
  24:   "96px",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────────────────────────────────────

export const borderRadius = {
  sm:   "6px",
  md:   "8px",
  lg:   "10px",
  /** Default interactive elements (inputs, buttons) */
  xl:   "14px",
  /** Cards, panels */
  "2xl": "20px",
  /** Pills, badges */
  full: "9999px",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

export const animation = {
  duration: {
    fast:    "150ms",
    default: "250ms",
    slow:    "400ms",
  },
  easing: {
    default: "ease-out",
    spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  /** fade-up — entry animation used on landing sections */
  fadeUp: "fade-up 400ms ease-out both",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export const component = {
  button: {
    borderRadius: borderRadius.xl,
    fontWeight: 700,
    fontSize: "0.875rem",
    height: { sm: "36px", md: "44px", lg: "48px", icon: "40px" },
    padding: { sm: "0 12px", md: "0 20px", lg: "0 24px" },
    variants: {
      primary:   { background: color.accent,      text: color.accentInk,   hover: "rgba(231,255,82,0.9)" },
      secondary: { background: color.paper,        text: color.graphite,    hover: color.paperDim },
      ghost:     { background: "transparent",      text: color.paper,       hover: color.graphiteSoft },
      outline:   { background: "transparent",      text: color.paper,       border: "rgba(242,242,242,0.3)", hover: color.graphiteSoft },
      link:      { background: "transparent",      text: color.paper,       hover: color.accent, decoration: "underline" },
      danger:    { background: color.danger,       text: color.graphite,    hover: "rgba(255,107,107,0.9)" },
    },
  },

  input: {
    height: "44px",
    borderRadius: borderRadius.xl,
    border: color.graphiteLine,
    background: color.graphiteSoft,
    text: color.paper,
    placeholder: color.paperMute,
    focus: { border: color.accent, ring: color.accent },
    error: { border: color.danger },
    paddingX: spacing[4],
  },

  textarea: {
    minHeight: "120px",
    paddingY: spacing[3],
    /** Inherits all other tokens from input */
  },

  card: {
    borderRadius: borderRadius["2xl"],
    background: color.graphiteSoft,
    border: color.graphiteLine,
    padding: spacing[6],
  },

  badge: {
    borderRadius: borderRadius.full,
    paddingX: "8px",
    paddingY: "4px",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    variants: {
      accent:  { background: "rgba(231,255,82,0.2)",  text: color.accent },
      neutral: { background: color.graphiteLine,       text: color.paperDim },
      danger:  { background: "rgba(255,107,107,0.15)", text: color.danger },
      success: { background: "rgba(61,220,151,0.15)",  text: color.success },
    },
  },

  progressBar: {
    height: "8px",
    borderRadius: borderRadius.full,
    background: color.graphiteLine,
    fill: color.accent,
    transition: "width 500ms ease-out",
  },

  divider: {
    height: "1px",
    background: color.graphiteLine,
  },

  focus: {
    /** Global focus ring — applied via *:focus-visible in globals.css */
    ring: `0 0 0 2px ${color.accent}`,
    offset: `0 0 0 2px ${color.graphite}`,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC ALIASES
// ─────────────────────────────────────────────────────────────────────────────

export const semantic = {
  surface: {
    base:    color.graphite,
    raised:  color.graphiteSoft,
    overlay: color.graphiteLine,
  },
  text: {
    primary:   color.paper,
    secondary: color.paperDim,
    tertiary:  color.paperMute,
  },
  brand: {
    primary:   color.accent,
    onPrimary: color.accentInk,
  },
  feedback: {
    error:   color.danger,
    success: color.success,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export const layout = {
  /** .container-hero — mx-auto w-full max-w-6xl px-6 */
  containerHero: {
    maxWidth: "1280px",
    padding: "0 24px",
    margin: "0 auto",
  },
  breakpoints: {
    sm:  "640px",
    md:  "768px",
    lg:  "1024px",
    xl:  "1280px",
    "2xl": "1536px",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FULL THEME EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const theme = {
  color,
  typography,
  spacing,
  borderRadius,
  animation,
  component,
  semantic,
  layout,
} as const;

export type Theme = typeof theme;
