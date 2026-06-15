import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";
import TopNavBarComponent from "../components/TopNavBarComponent";

export default function Otp() {
  const router = useRouter();
  const { user } = useApp();
  const [code, setCode] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState("");

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);

    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = () => {
    const fullCode = code.join("");
    if (fullCode.length < 4) {
      setError("Please enter the complete 4-digit OTP");
      return;
    }
    // Hardcode simulated success OTP (e.g. 1234 or any 4 digit code)
    setError("");
    router.push("/profile-setup");
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(59);
      setCode(["", "", "", ""]);
      setError("");
      inputRefs[0].current?.focus();
    }
  };

  const isComplete = code.every((digit) => digit !== "");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <TopNavBarComponent showBack title="OTP Verification" />
          <View style={styles.content}>
            <Text style={styles.title}>Verify Your Number</Text>
            <Text style={styles.subtitle}>
              We sent a 4-digit verification code to{"\n"}
              <Text style={styles.phoneText}>{user.phone || "+237 6XX XX XX XX"}</Text>
            </Text>

            <View style={styles.codeContainer}>
              {code.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={inputRefs[idx]}
                  style={[styles.digitInput, error ? styles.digitInputError : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  textAlign="center"
                  autoFocus={idx === 0}
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.resendContainer}>
              {timer > 0 ? (
                <Text style={styles.timerText}>Resend code in {timer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Button
            title="Verify Code"
            onPress={handleVerify}
            disabled={!isComplete}
            type="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 50,
    paddingBottom: 40,
  },
  topSection: {
    flex: 1,
  },
  content: {
    marginTop: 30,
  },
  title: {
    fontSize: TYPOGRAPHY.headlineLg.fontSize,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 40,
  },
  phoneText: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  digitInput: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  digitInputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 30,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: "500",
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primaryContainer,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  bottomSection: {
    marginTop: 20,
  },
});
