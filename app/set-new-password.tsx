import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";

export default function SetNewPassword() {
  const router = useRouter();
  const { updatePassword } = useApp();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleUpdatePassword = async () => {
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    
    try {
      await updatePassword(password);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
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
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Set New Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>Your new password must be different from previous used passwords.</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={COLORS.outline}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={22} 
                color={COLORS.onSurfaceVariant} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={COLORS.outline}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={22} 
                color={COLORS.onSurfaceVariant} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 32 }}>
          <Button
            title={isSubmitting ? "Updating..." : "Reset Password"}
            onPress={handleUpdatePassword}
            disabled={isSubmitting || !password || !confirmPassword}
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  headerSpacer: { width: 44 },
  content: { flex: 1 },
  title: {
    ...TYPOGRAPHY.bodyLg,
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
    ...TYPOGRAPHY.bodyMd,
    fontWeight: "600",
    color: COLORS.primary,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.primary,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
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
