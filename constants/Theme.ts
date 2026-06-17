export const LIGHT_COLORS = {
  // Brand Colors
  primary: "#00113a", // Trust Blue
  primaryContainer: "#002366",
  secondary: "#006d43", // Growth Green
  secondaryContainer: "#75f8b3",
  tertiary: "#735c00", // Community Gold
  tertiaryContainer: "#cca830",

  // Base Colors
  background: "#f8f9fa",
  surface: "#ffffff",
  surfaceContainer: "#edeeef",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainerHigh: "#e7e8e9",

  // Text Colors
  onPrimary: "#ffffff",
  onSecondary: "#ffffff",
  onBackground: "#191c1d",
  onSurface: "#191c1d",
  onSurfaceVariant: "#444650",

  // Accents & Borders
  outline: "#757682",
  outlineVariant: "#c5c6d2",
  error: "#ba1a1a",

  // Operator Specifics
  mtn: "#ffcc00",
  orange: "#ff6600",
};

export const DARK_COLORS = {
  // Brand Colors
  primary: "#a9c7ff", // Soft Trust Blue
  primaryContainer: "#003a8c", // lightened from #002a78 — was nearly invisible against dark surfaces
  secondary: "#52db9a", // Vibrant Growth Green
  secondaryContainer: "#00693f", // lightened from #005231
  tertiary: "#ffe264",
  tertiaryContainer: "#6b5700", // lightened from #554400

  // Base Colors — wider tonal spread so elevation actually reads
  background: "#0d0f14", // darkest layer
  surface: "#161821", // +9% lightness over background — cards now visibly lift off the bg
  surfaceContainer: "#1f222c", // +6% over surface
  surfaceContainerLow: "#13151c",
  surfaceContainerHigh: "#2b2e3a", // +8% over surfaceContainer — top-level elevation now visible

  // Text Colors
  onPrimary: "#98c1f6ff",
  onSecondary: "#003920",
  onBackground: "#e8e8ec", // bumped slightly for stronger contrast against background
  onSurface: "#e8e8ec",
  onSurfaceVariant: "#c9cad6",

  // Accents & Borders — the actual contrast/border fix
  outline: "#5c5e6b", // darkened from #8f909a but recalibrated against lighter surfaces, holds ~3:1
  outlineVariant: "#3a3d4a", // lightened from #444650 — now visibly distinct from background/surface
  error: "#ffb4ab",

  // Operator Specifics
  mtn: "#ffcc00",
  orange: "#ff6600",
};

export const COLORS = LIGHT_COLORS;

export const TYPOGRAPHY = {
  displayBalance: {
    fontSize: 32, // Adjusted for mobile screens
    fontWeight: "700" as const,
    lineHeight: 40,
    letterSpacing: -0.64,
  },
  headlineLg: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  headlineMd: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  labelBold: {
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 16,
  },
  numeralLg: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
  },
};

export const ROUNDED = {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SPACING = {
  base: 4,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  containerPadding: 20,
  gutter: 16,
};