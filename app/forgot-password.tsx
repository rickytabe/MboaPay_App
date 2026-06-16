import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";

export default function ForgotPassword() {
  const router = useRouter();
  const { requestPasswordReset } = useApp();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleResetRequest = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    
    try {
      await requestPasswordReset(email);
      router.push({
        pathname: "/reset-otp",
        params: { email }
      });
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reset Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email address and we'll send you an OTP to reset your password.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.outline}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 32 }}>
          <Button
            title="Send Reset Code"
            onPress={handleResetRequest}
            disabled={isSubmitting || !email}
            loading={isSubmitting}
            type="primary"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  headerSpacer: { width: 44 },
  content: { flex: 1 },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.onSurfaceVariant,
    marginBottom: 40,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    ...TYPOGRAPHY.bodySm,
    fontWeight: "600",
    color: COLORS.primary,
  },
  input: {
    height: 56,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
  },
});
