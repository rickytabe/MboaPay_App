import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, SPACING, TYPOGRAPHY } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";

export default function Login() {
  const router = useRouter();
  const { loginWithEmail } = useApp();
  const toast = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      
      await loginWithEmail(email, password);
      
      router.replace("/(tabs)/home");
    } catch (err) {
      const message = getErrorMessage(err, "Login failed. Please check your credentials.");
      setError(message);
      toast.error("Login Failed", message);
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
        <Text style={styles.headerTitle}>Sign In</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.subtitle}>Sign in with your email and password.</Text>

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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.outline}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
            title={isSubmitting ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={isSubmitting || !email || !password}
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
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
  },
  headerSpacer: { width: 44, height: 44 },
  content: { flex: 1 },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    marginBottom: 36,
  },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: "600" },
});
