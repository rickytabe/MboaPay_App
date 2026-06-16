import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { COLORS, SPACING } from "../constants/Theme";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";

export default function Register() {
  const router = useRouter();
  const { registerWithEmail } = useApp();
  const toast = useToast();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [currentProvider, setCurrentProvider] = useState<"MTN" | "Orange" | null>(null);
  const [isFetchingProvider, setIsFetchingProvider] = useState(false);
  
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [bottomActionsHeight, setBottomActionsHeight] = useState(136);
  const inputRef = useRef<TextInput>(null);

  // Animated values
  const borderAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeIn]);

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [borderAnim, isFocused]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (phone.length === 9) {
      fetchProvider(`+237${phone}`);
    } else {
      setCurrentProvider(null);
    }
  }, [phone]);

  const fetchProvider = async (fullPhone: string) => {
    try {
      setIsFetchingProvider(true);
      const token = process.env.EXPO_PUBLIC_PAWAPAY_TOKEN;
      const resp = await fetch("https://api.sandbox.pawapay.io/v2/predict-provider", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      if (resp.ok) {
        const body = await resp.json();
        const prov = (body?.provider || "").toString().toUpperCase();
        if (prov.includes("MTN")) setCurrentProvider("MTN");
        else if (prov.includes("ORANGE")) setCurrentProvider("Orange");
        else setCurrentProvider(null);
      } else {
        setCurrentProvider(null);
      }
    } catch (e) {
      setCurrentProvider(null);
    } finally {
      setIsFetchingProvider(false);
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      triggerShake();
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      triggerShake();
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      triggerShake();
      return;
    }
    if (phone.length < 9) {
      setError("Enter a valid 9-digit phone number.");
      triggerShake();
      return;
    }

    const fullPhone = `+237${phone}`;

    try {
      setIsSubmitting(true);
      setError("");
      
      const { pendingEmail } = await registerWithEmail(email, password, fullName.trim(), fullPhone, currentProvider || undefined);
      
      toast.success("Check your email", "We sent you a 6-digit verification code.");
      router.push({ pathname: "/otp", params: { email: pendingEmail } });
    } catch (err: any) {
      console.error("APP REGISTRATION ERROR:", err);
      let rawMessage = getErrorMessage(err, "Registration failed.");
      let cleanMessage = rawMessage;
      
      try {
        if (rawMessage.includes("{")) {
          const jsonStr = rawMessage.substring(rawMessage.indexOf("{"));
          const parsed = JSON.parse(jsonStr);
          cleanMessage = parsed.message || parsed.error_description || parsed.msg || "Registration failed.";
        }
      } catch(e) {
        if (cleanMessage.length > 80) {
          cleanMessage = "An error occurred during registration. Please try again.";
        }
      }

      setError(cleanMessage);
      toast.error("Registration Error", cleanMessage);
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned.length <= 9) {
      setPhone(cleaned);
      if (error && cleaned.length >= 9) setError("");
    }
  };

  const formatPhone = (raw: string) => {
    if (raw.length <= 1) return raw;
    if (raw.length <= 3) return `${raw.slice(0, 1)}${raw.slice(1)}`;
    if (raw.length <= 5) return `${raw.slice(0, 1)}${raw.slice(1, 3)} ${raw.slice(3)}`;
    if (raw.length <= 7) return `${raw.slice(0, 1)}${raw.slice(1, 3)} ${raw.slice(3, 5)} ${raw.slice(5)}`;
    return `${raw.slice(0, 1)}${raw.slice(1, 3)} ${raw.slice(3, 5)} ${raw.slice(5, 7)} ${raw.slice(7)}`;
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.outlineVariant, COLORS.primaryContainer],
  });

  const isValid = fullName.trim().length > 0 && phone.length === 9 && email.length > 3 && password.length >= 6;

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.contentScroller}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomActionsHeight + keyboardHeight + 36 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{"Welcome to\nMboaPay!"}</Text>
          <Text style={styles.subtitle}>
            {"Create your account to get started."}
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.standardInput}
                placeholder="e.g. John Doe"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.standardInput}
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password (6+ chars)</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
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
              
              {password.length > 0 && (() => {
                let score = 0;
                if (password.length > 5) score += 1;
                if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
                if (/\d/.test(password)) score += 1;
                if (/[^A-Za-z0-9]/.test(password)) score += 1;
                score = Math.min(score, 4);

                const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
                const strengthColors = [COLORS.error, COLORS.error, COLORS.orange, COLORS.secondary, COLORS.primary];
                
                return (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBarBackground}>
                      <View 
                        style={[
                          styles.strengthBarFill, 
                          { 
                            width: `${(score + 1) * 20}%`, 
                            backgroundColor: strengthColors[score] 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.strengthText, { color: strengthColors[score] }]}>
                      {strengthLabels[score]}
                    </Text>
                  </View>
                );
              })()}
            </View>

            {/* Mobile Money Number Input */}
            <Text style={styles.label}>Mobile Money Number</Text>
            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
              <Animated.View style={[styles.inputCard, { borderColor: error ? COLORS.error : borderColor }]}>
                <View style={styles.countrySection}>
                  <Text style={styles.flag}>🇨🇲</Text>
                  <Text style={styles.countryCode}>+237</Text>
                  <View style={styles.divider} />
                </View>
                <View style={styles.phoneSection}>
                  {phone.length === 0 && !isFocused ? (
                    <Text style={styles.placeholder}>6XX XX XX XX</Text>
                  ) : (
                    <Text style={styles.phoneDisplay}>
                      {formatPhone(phone)}
                      {isFocused && <Text style={styles.cursor}>|</Text>}
                    </Text>
                  )}
                </View>
                {phone.length === 9 && (
                  <View style={styles.checkCircle}>
                    {isFetchingProvider ? (
                      <Ionicons name="sync" size={16} color={COLORS.onPrimary} style={{ transform: [{ rotate: "180deg" }] }} />
                    ) : currentProvider === "MTN" ? (
                      <Image 
                        source={{ uri: "https://i.pinimg.com/1200x/02/cb/c3/02cbc305b506ea1ffcd73028d59df80b.jpg" }} 
                        style={styles.providerLogo} 
                        resizeMode="contain" 
                      />
                    ) : currentProvider === "Orange" ? (
                      <Image 
                        source={{ uri: "https://i.pinimg.com/736x/92/92/87/929287df7958f0e3043aef7a0f707c2f.jpg" }} 
                        style={styles.providerLogo} 
                        resizeMode="contain" 
                      />
                    ) : (
                      <Ionicons name="checkmark" size={16} color={COLORS.onPrimary} />
                    )}
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              keyboardType="number-pad"
              value={phone}
              onChangeText={handleTextChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              maxLength={9}
            />
          </Animated.View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          onLayout={(event) => setBottomActionsHeight(event.nativeEvent.layout.height)}
          style={[styles.bottomSection, { bottom: keyboardHeight > 0 ? keyboardHeight + 14 : 36 }]}
        >
          <Button
            title={isSubmitting ? "Creating Account..." : "Create Account"}
            onPress={handleRegister}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
            type="primary"
          />

          <View style={styles.signinRow}>
            <Text style={styles.signinLabel}>Already have an account? </Text>
            <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7} disabled={isSubmitting}>
              <Text style={styles.signinLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 56,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.primary },
  headerSpacer: { width: 44, height: 44 },
  contentScroller: { flex: 1, marginTop: 32 },
  content: { flexGrow: 1 },
  title: { fontSize: 30, fontWeight: "900", color: COLORS.primary, lineHeight: 38, letterSpacing: -0.6, marginBottom: 10 },
  subtitle: { fontSize: 15, color: COLORS.onSurfaceVariant, lineHeight: 22, marginBottom: 24 },
  
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.primary, marginBottom: 8 },
  standardInput: { height: 56, backgroundColor: COLORS.surface, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: COLORS.outlineVariant },

  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  strengthBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  strengthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "700",
  },

  inputCard: { flexDirection: "row", alignItems: "center", height: 64, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 2, paddingHorizontal: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  countrySection: { flexDirection: "row", alignItems: "center", marginRight: 4 },
  flag: { fontSize: 22, marginRight: 6 },
  countryCode: { fontSize: 18, fontWeight: "800", color: COLORS.primary, marginRight: 12 },
  divider: { width: 1.5, height: 28, backgroundColor: COLORS.outlineVariant, marginRight: 12 },
  phoneSection: { flex: 1, justifyContent: "center" },
  placeholder: { fontSize: 18, fontWeight: "600", color: COLORS.outline, letterSpacing: 1 },
  phoneDisplay: { fontSize: 20, fontWeight: "800", color: COLORS.primary, letterSpacing: 1.5 },
  cursor: { color: COLORS.primaryContainer, fontWeight: "300" },
  checkCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.secondaryContainer, justifyContent: "center", alignItems: "center", overflow: 'hidden' },
  providerLogo: { width: 34, height: 34, borderRadius: 17 },
  hiddenInput: { position: "absolute", opacity: 0, height: 0, width: 0 },
  
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingLeft: 4 },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: "600" },
  bottomSection: { position: "absolute", left: SPACING.containerPadding, right: SPACING.containerPadding, alignItems: "center", gap: 16 },
  signinRow: { flexDirection: "row", alignItems: "center" },
  signinLabel: { fontSize: 14, color: COLORS.onSurfaceVariant },
  signinLink: { fontSize: 14, fontWeight: "700", color: COLORS.primaryContainer },
});
