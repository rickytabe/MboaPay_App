import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { COLORS, ROUNDED, SPACING } from "../constants/Theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "flat" | "elevated" | "outlined" | "primary" | "secondary";
  noPadding?: boolean;
}

export const Card = ({
  children,
  style,
  variant = "elevated",
  noPadding = false,
}: CardProps) => {
  const getCardStyle = () => {
    switch (variant) {
      case "flat":
        return styles.flat;
      case "elevated":
        return styles.elevated;
      case "outlined":
        return styles.outlined;
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
    }
  };

  return (
    <View
      style={[
        styles.card,
        getCardStyle(),
        noPadding && styles.noPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: ROUNDED.xl, // 24px as defined in shapes guidelines
    padding: SPACING.md + 4, // ~20px padding
    overflow: "hidden",
  },
  noPadding: {
    padding: 0,
  },
  flat: {
    backgroundColor: COLORS.surfaceContainer,
  },
  elevated: {
    backgroundColor: COLORS.surface,
    shadowColor: "rgba(0, 17, 58, 0.08)", // sample Trust Blue for shadow tint
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 3,
  },
  outlined: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  primary: {
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
});

export default Card;
