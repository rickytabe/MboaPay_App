import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const isPlaceholderUrl = (url?: string) =>
  !url ||
  url.includes("your-project.supabase.co") ||
  url.includes("missing-project.supabase.co") ||
  url.includes("example.supabase.co");

const isPlaceholderKey = (key?: string) =>
  !key ||
  key.includes("your_key_here") ||
  key.includes("missing-publishable-key") ||
  key.includes("example");

export const supabaseConfigError =
  isPlaceholderUrl(supabaseUrl) || isPlaceholderKey(supabasePublishableKey)
    ? "Invalid Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in MboaPay_App/.env to your project URL and anon key."
    : "";

export const supabase = createClient(
  supabaseUrl || "https://missing-project.supabase.co",
  supabasePublishableKey || "missing-publishable-key",
  {
    auth: {
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export const ensureSupabaseConfigured = () => {
  if (supabaseConfigError) {
    throw new Error(supabaseConfigError);
  }
};
