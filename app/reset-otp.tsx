import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Keyboard,
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

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 30;

export default function ResetOtpVerification() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>();
  const { verifyPasswordResetOtp, requestPasswordReset } = useApp();
  const toast = useToast();

  const email = params.email || "";
  const maskedEmail = email
    ? `${email.charAt(0)}${"*".repeat(Math.max(0, email.indexOf("@") - 1))}${email.substring(email.indexOf("@"))}`
    : "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Auto-focus first input after a short delay
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
  }, [fadeIn]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste — spread pasted string across all boxes
      const chars = text.replace(/[^0-9]/g, "").split("").slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      chars.forEach((char, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      setError("");
      return;
    }

    const cleaned = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setError("");

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpCode = otp.join("");
  const isComplete = otpCode.length === OTP_LENGTH;

  const handleVerify = async () => {
    if (!isComplete) {
      setError("Please enter the full 6-digit code.");
      triggerShake();
      return;
    }
    if (!email) {
      setError("Email is missing. Please go back and request reset again.");
      triggerShake();
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await verifyPasswordResetOtp(email, otpCode);

      // On success, go to set-new-password
      router.replace("/set-new-password");
    } catch (err: any) {
      console.error("OTP RESET VERIFY ERROR:", err);
      setError(err.message || "Verification failed. Please try again.");
      triggerShake();
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Error", "Email not found. Please try requesting a reset again.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await requestPasswordReset(email);
      toast.success("Code Sent", "A new reset code has been sent to your email.");
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to resend reset code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canResend = countdown === 0 && !isSubmitting;

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Reset Code</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit verification code to
        </Text>
        <Text style={styles.emailText}>{maskedEmail}</Text>

        {/* OTP Input Grid */}
        <Animated.View
          style={[styles.otpContainer, { transform: [{ translateX: shakeAnim }] }]}
        >
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : {},
                error ? styles.otpBoxError : {},
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          onPress={handleResend}
          disabled={!canResend}
          style={[
            styles.resendButton,
            (!canResend || countdown > 0) && styles.resendButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.resendText}>
            {countdown > 0
              ? `Resend available in ${countdown}s`
              : "Didn't get the code? "}
            {countdown === 0 ? <Text style={styles.resendLink}>Resend</Text> : null}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomSection, { bottom: keyboardHeight > 0 ? keyboardHeight + 14 : 36 }]}>
        <Button
          title={isSubmitting ? "Verifying..." : "Verify OTP"}
          onPress={handleVerify}
          disabled={!isComplete || isSubmitting}
          loading={isSubmitting}
          type="primary"
        />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.primary },
  headerSpacer: { width: 44, height: 44 },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryContainer + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
  emailText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 32,
    marginTop: 4,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer + "10",
  },
  otpBoxError: {
    borderColor: COLORS.error,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: "600" },
  resendButton: {
    marginTop: 24,
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  resendLink: {
    fontWeight: "700",
    color: COLORS.primaryContainer,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  bottomSection: {
    position: "absolute",
    left: SPACING.containerPadding,
    right: SPACING.containerPadding,
    alignItems: "center",
  },
});
