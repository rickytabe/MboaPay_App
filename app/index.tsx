import React, { useEffect } from "react";
import { StyleSheet, Text, View, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import Button from "../components/Button";

export default function Index() {
  const router = useRouter();
  const { user } = useApp();

  useEffect(() => {
    if (user.isLoggedIn) {
      router.replace("/(tabs)/home");
    }
  }, [user.isLoggedIn]);

  if (user.isLoggedIn) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        {/* Visual Brand Elements */}
        <View style={styles.logoCircleContainer}>
          <View style={styles.logoCircleOuter}>
            <View style={styles.logoCircleInner}>
              <Text style={styles.logoText}>M</Text>
            </View>
          </View>
        </View>

        <Text style={styles.brandName}>MboaPay</Text>
        <Text style={styles.tagline}>Digital Trust &amp; Communal Growth</Text>
        <Text style={styles.description}>
          The modern, secure platform for your tontines, savings circles, and protected escrow transactions in Cameroon.
        </Text>
      </View>

      <View style={styles.buttonSection}>
        <Button
          title="Get Started"
          onPress={() => router.push("/register")}
          type="primary"
        />
        <Text style={styles.footerNote}>
          Securely backed by MTN MoMo &amp; Orange Money
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.containerPadding,
    justifyContent: "space-between",
    paddingTop: 100,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 40,
  },
  logoCircleContainer: {
    marginBottom: 24,
  },
  logoCircleOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0, 35, 102, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900",
  },
  brandName: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: TYPOGRAPHY.bodyLg.fontSize,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 20,
  },
  description: {
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  buttonSection: {
    alignItems: "center",
    width: "100%",
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 16,
    fontWeight: "600",
  },
});
