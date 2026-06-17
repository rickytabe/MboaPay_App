import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { ROUNDED, SPACING } from "../constants/Theme";
import { useApp } from "../context/AppContext";

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
  const { colors } = useApp();

  const getCardStyle = () => {
    switch (variant) {
      case "flat":
        return { backgroundColor: colors.surfaceContainer };
      case "elevated":
        return {
          backgroundColor: colors.surface,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 6,
          borderWidth: 1,
          borderColor: colors.surfaceContainerHigh,
        };
      case "outlined":
        return {
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.outlineVariant,
        };
      case "primary":
        return {
          backgroundColor: colors.primaryContainer,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 4,
        };
      case "secondary":
        return {
          backgroundColor: colors.secondary,
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 4,
        };
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
    borderRadius: ROUNDED.xl,
    padding: SPACING.md + 4,
    overflow: "hidden",
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
