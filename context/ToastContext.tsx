import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, ROUNDED, SPACING } from "../constants/Theme";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  message?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "message">> {
  id: string;
  message?: string;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_LIMIT = 3;
const DEFAULT_DURATION = 4200;

const toastMeta: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; background: string }> = {
  success: {
    icon: "checkmark-circle",
    color: COLORS.secondary,
    background: "#ecf8f2",
  },
  error: {
    icon: "alert-circle",
    color: COLORS.error,
    background: "#fff0f0",
  },
  warning: {
    icon: "warning",
    color: COLORS.tertiary,
    background: "#fff8df",
  },
  info: {
    icon: "information-circle",
    color: COLORS.primaryContainer,
    background: "#eef3ff",
  },
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = DEFAULT_DURATION }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextToast: ToastItem = { id, title, message, type, duration };

      setToasts((current) => [nextToast, ...current.filter((toast) => toast.title !== title)].slice(0, TOAST_LIMIT));

      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismissToast(id), duration);
      }

      return id;
    },
    [dismissToast]
  );

  const value = useMemo<ToastContextType>(
    () => ({
      showToast,
      dismissToast,
      success: (title, message) => showToast({ title, message, type: "success" }),
      error: (title, message) => showToast({ title, message, type: "error" }),
      warning: (title, message) => showToast({ title, message, type: "warning" }),
      info: (title, message) => showToast({ title, message, type: "info" }),
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

const ToastViewport = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.viewport, { top: insets.top + 10 }]}>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </View>
  );
};

const ToastCard = ({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) => {
  const entry = useRef(new Animated.Value(0)).current;
  const meta = toastMeta[toast.type];

  React.useEffect(() => {
    Animated.spring(entry, {
      toValue: 1,
      damping: 16,
      stiffness: 170,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [entry]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: entry,
          transform: [
            {
              translateY: entry.interpolate({
                inputRange: [0, 1],
                outputRange: [-18, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${toast.type} notification: ${toast.title}`}
        onPress={onDismiss}
        style={styles.toastPressable}
      >
        <View style={[styles.iconWrap, { backgroundColor: meta.background }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>
        <View style={styles.toastCopy}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          {toast.message ? <Text style={styles.toastMessage}>{toast.message}</Text> : null}
        </View>
        <Ionicons name="close" size={17} color={COLORS.outline} />
      </Pressable>
    </Animated.View>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    left: SPACING.containerPadding,
    right: SPACING.containerPadding,
    zIndex: 1000,
    gap: 10,
  },
  toast: {
    borderRadius: ROUNDED.md,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  toastPressable: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: ROUNDED.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  toastCopy: {
    flex: 1,
    gap: 2,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  toastMessage: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
});
