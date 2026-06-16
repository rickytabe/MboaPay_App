import React from "react";
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, ROUNDED, SPACING, TYPOGRAPHY } from "../constants/Theme";
import Button from "./Button";

type StateVariant = "info" | "success" | "warning" | "error" | "loading";

interface StateNoticeProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  variant?: StateVariant;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const variantStyles: Record<StateVariant, { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }> = {
  info: {
    icon: "shield-checkmark",
    color: COLORS.primaryContainer,
    background: "#eef3ff",
  },
  success: {
    icon: "checkmark-circle",
    color: COLORS.secondary,
    background: "#ecf8f2",
  },
  warning: {
    icon: "warning",
    color: COLORS.tertiary,
    background: "#fff8df",
  },
  error: {
    icon: "alert-circle",
    color: COLORS.error,
    background: "#fff0f0",
  },
  loading: {
    icon: "sync",
    color: COLORS.primaryContainer,
    background: "#eef3ff",
  },
};

export default function StateNotice({
  icon,
  title,
  message,
  variant = "info",
  actionLabel,
  onAction,
  style,
}: StateNoticeProps) {
  const meta = variantStyles[variant];

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconHalo, { backgroundColor: meta.background }]}>
        {variant === "loading" ? (
          <ActivityIndicator color={meta.color} />
        ) : (
          <Ionicons name={icon || meta.icon} size={42} color={meta.color} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} type={variant === "error" ? "outlined" : "primary"} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.containerPadding,
    backgroundColor: COLORS.background,
  },
  iconHalo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  title: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.headlineLg.fontSize,
    lineHeight: TYPOGRAPHY.headlineLg.lineHeight,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    marginTop: 8,
    color: COLORS.onSurfaceVariant,
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    lineHeight: 20,
    textAlign: "center",
  },
  action: {
    marginTop: 24,
    maxWidth: 260,
    borderRadius: ROUNDED.md,
  },
});
