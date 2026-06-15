import React from "react";
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { COLORS, ROUNDED, SPACING, TYPOGRAPHY } from "../constants/Theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: "primary" | "secondary" | "outlined" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  type = "primary",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) => {
  const getButtonStyle = () => {
    switch (type) {
      case "primary":
        return styles.primary;
      case "secondary":
        return styles.secondary;
      case "outlined":
        return styles.outlined;
      case "ghost":
        return styles.ghost;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case "primary":
        return styles.primaryText;
      case "secondary":
        return styles.secondaryText;
      case "outlined":
        return styles.outlinedText;
      case "ghost":
        return styles.ghostText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={type === "outlined" || type === "ghost" ? COLORS.primary : "#ffffff"}
        />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: ROUNDED.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    flexDirection: "row",
    width: "100%",
  },
  primary: {
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primaryContainer,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: TYPOGRAPHY.bodyLg.fontSize,
    fontWeight: "700",
  },
  primaryText: {
    color: "#ffffff",
  },
  secondaryText: {
    color: "#ffffff",
  },
  outlinedText: {
    color: COLORS.primaryContainer,
  },
  ghostText: {
    color: COLORS.primaryContainer,
  },
});
export default Button;
