export const getErrorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (error instanceof Error) {
    return normalizeKnownError(error.message, fallback);
  }

  if (typeof error === "string") {
    return normalizeKnownError(error, fallback);
  }

  return fallback;
};

const normalizeKnownError = (message: string, fallback: string) => {
  const cleanMessage = message.trim();
  const lower = cleanMessage.toLowerCase();

  if (!cleanMessage) {
    return fallback;
  }

  if (lower.includes("missing expo supabase env vars")) {
    return "Supabase is not configured on this build. Add the Expo public Supabase URL and publishable key.";
  }

  if (lower.includes("failed to fetch") || lower.includes("network request failed")) {
    return "Network connection failed. Check your internet connection and try again.";
  }

  if (lower.includes("otp") && (lower.includes("invalid") || lower.includes("expired"))) {
    return "That verification code is invalid or expired. Request a new code and try again.";
  }

  if (lower.includes("rate limit") || lower.includes("security purposes")) {
    return "Too many attempts. Please wait a moment before trying again.";
  }

  if (lower.includes("profile row not found")) {
    return "Your auth account exists, but the MboaPay profile was not created. Run the auth trigger in Supabase and try again.";
  }

  if (lower.includes("session expired") || lower.includes("jwt expired")) {
    return "Your session expired. Please sign in again.";
  }

  return cleanMessage;
};
