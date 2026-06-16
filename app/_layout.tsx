import React, { useEffect, useRef } from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Slot, useRouter, useSegments } from "expo-router";
import { AppProvider } from "../context/AppContext";
import { ToastProvider, useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import AppErrorBoundary from "../components/AppErrorBoundary";

const PUBLIC_ROUTES = new Set(["", "login", "register", "otp", "forgot-password", "reset-otp", "set-new-password"]);

function AppShell() {
  const router = useRouter();
  const segments = useSegments();
  const toast = useToast();
  const { user, hasAuthSession, isAuthLoading, pendingEmail } = useApp();
  const lastGuardTarget = useRef("");

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const firstSegment = segments[0] || "";
    const isPublicRoute = PUBLIC_ROUTES.has(firstSegment);
    const guardTarget = `${firstSegment}:${user.isLoggedIn}:${hasAuthSession}`;

    if (lastGuardTarget.current === guardTarget) {
      return;
    }

    if (!user.isLoggedIn && !isPublicRoute) {
      lastGuardTarget.current = guardTarget;

      if (!hasAuthSession) {
        toast.warning("Sign in required", "Please sign in or create an account.");
        router.replace("/register");
      }

      return;
    }


    if (!hasAuthSession && firstSegment === "otp" && !pendingEmail && !user.phone) {
      lastGuardTarget.current = guardTarget;
      toast.warning("Registration needed", "Please register first to receive a verification code.");
      router.replace("/register");
    }
  }, [hasAuthSession, isAuthLoading, router, segments, toast, user.isLoggedIn, user.phone, pendingEmail]);

  return (
    <AppErrorBoundary onReset={() => router.replace(user.isLoggedIn ? "/(tabs)/home" : "/")}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <Slot />
    </AppErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </SafeAreaProvider>
    </AppProvider>
  );
}
