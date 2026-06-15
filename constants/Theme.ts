export const COLORS = {
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
