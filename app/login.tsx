import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { LIGHT_COLORS, SPACING } from "../constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";

export default function Login() {
  const router = useRouter();
  const { loginWithEmail, colors } = useApp();
  const toast = useToast();
  const styles = getStyles(colors);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
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
            placeholderTextColor={colors.outline}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
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
                color={colors.onSurfaceVariant} 
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.forgotPasswordButton} 
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
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

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24 }}>
          <Text style={{ fontSize: 14, color: colors.onSurfaceVariant }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/register")} activeOpacity={0.7} disabled={isSubmitting}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primaryContainer }}>Sign up</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16 }}>
          <TouchableOpacity onPress={() => router.replace("/")} activeOpacity={0.7} disabled={isSubmitting}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.onSurfaceVariant, textDecorationLine: 'underline' }}>Return to Onboarding</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "auto", paddingBottom: 24, paddingTop: 40 }}>
          <Text style={{ fontSize: 12, color: colors.onSurfaceVariant }}>Powered by pawaPay</Text>
          <Image source={require('../assets/Pawapay_logo.png')} style={{ height: 18, width: 75, resizeMode: 'contain', marginLeft: -12 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  headerSpacer: { width: 44, height: 44 },
  content: { flex: 1 },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.onSurfaceVariant,
    marginBottom: 36,
  },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    color: colors.onBackground,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.onBackground,
  },
  eyeButton: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: colors.primaryContainer,
    fontSize: 13,
    fontWeight: "700",
  },
});
