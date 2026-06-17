import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { LIGHT_COLORS } from "../constants/Theme";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Image } from "react-native";
import { useApp } from "../context/AppContext";
import InitialsAvatar from "./InitialsAvatar";

const { width } = Dimensions.get("window");

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user, colors, theme } = useApp();
  const styles = getStyles(colors);
  
  const TAB_BAR_HEIGHT = 65;
  // Add 30px of extra height at the top for the elevated button container
  const containerHeight = TAB_BAR_HEIGHT + insets.bottom + 30;
  
  const cx = width / 2;
  const notchWidth = 125;
  const notchDepth = 55;
  const leftStart = cx - notchWidth / 2;
  const rightEnd = cx + notchWidth / 2;

  const walletRoute = state.routes[2];
  const isWalletFocused = state.index === 2;

  // Background SVG Path with curved cutout (notch) - Shifted down by 30px
  const dBackground = `
    M 0 30
    L ${leftStart} 30
    C ${leftStart + 20} 30, ${leftStart + 28} ${30 + notchDepth}, ${cx} ${30 + notchDepth}
    C ${rightEnd - 28} ${30 + notchDepth}, ${rightEnd - 20} 30, ${rightEnd} 30
    L ${width} 30
    L ${width} ${containerHeight}
    L 0 ${containerHeight}
    Z
  `;

  // Top border stroke that matches the cutout - Shifted down by 30px
  const dBorder = `
    M 0 30
    L ${leftStart} 30
    C ${leftStart + 20} 30, ${leftStart + 28} ${30 + notchDepth}, ${cx} ${30 + notchDepth}
    C ${rightEnd - 28} ${30 + notchDepth}, ${rightEnd - 20} 30, ${rightEnd} 30
    L ${width} 30
  `;

  // Set up animations for tab icon scaling
  const tabScales = useRef(state.routes.map(() => new Animated.Value(1))).current;
  const walletScaleVal = useRef(new Animated.Value(1)).current;

  // Trigger scale bounce animation on tab change
  useEffect(() => {
    state.routes.forEach((_, index) => {
      // Wallet tab has its own floating scale controller
      if (index !== 2) {
        Animated.spring(tabScales[index], {
          toValue: state.index === index ? 1.16 : 1.0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    });

    // Animate the floating wallet button if selected
    Animated.spring(walletScaleVal, {
      toValue: state.index === 2 ? 1.12 : 1.0,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const handlePress = (route: any, isFocused: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const handleWalletPressIn = () => {
    Animated.spring(walletScaleVal, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handleWalletPressOut = () => {
    Animated.spring(walletScaleVal, {
      toValue: state.index === 2 ? 1.12 : 1.0,
      friction: 4,
      useNativeDriver: true,
    }).start();
    handlePress(walletRoute, isWalletFocused);
  };

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {/* Custom SVG Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={width} height={containerHeight}>
          <Path d={dBackground} fill={colors.surface} />
          <Path d={dBorder} fill="none" stroke={colors.outlineVariant} strokeWidth={1.2} />
        </Svg>
      </View>

      {/* Tab Items Row - Absolute positioned at Y=20 (right under the SVG top border) */}
      <View style={[styles.tabItemsContainer, { height: TAB_BAR_HEIGHT }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // If this is the center tab (index 2: wallet), render a spacer
          // because the floating center button is absolutely positioned over it
          if (index === 2) {
            return <View key={route.key} style={styles.spacer} />;
          }

          let iconName: any = "help-outline";
          let label = "";

          switch (route.name) {
            case "home":
              iconName = isFocused ? "home" : "home-outline";
              label = "Home";
              break;
            case "circles":
              iconName = isFocused ? "people" : "people-outline";
              label = "Circles";
              break;
            case "escrow":
              iconName = isFocused ? "shield-checkmark" : "shield-checkmark-outline";
              label = "Escrow";
              break;
            case "profile":
              iconName = isFocused ? "person-circle" : "person-circle-outline";
              label = "Profile";
              break;
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={() => handlePress(route, isFocused)}
              activeOpacity={0.85}
              style={styles.tabItem}
            >
              <Animated.View style={{ transform: [{ scale: tabScales[index] }] }}>
                {route.name === "profile" ? (
                  <View style={[
                    { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
                    isFocused && { borderWidth: 2, borderColor: colors.primaryContainer }
                  ]}>
                    {user?.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={{ width: "100%", height: "100%" }} />
                    ) : (
                      <InitialsAvatar name={user?.name || ""} size={isFocused ? 24 : 28} />
                    )}
                  </View>
                ) : (
                  <Ionicons
                    name={iconName}
                    size={23}
                    color={isFocused ? colors.primaryContainer : colors.onSurfaceVariant}
                  />
                )}
              </Animated.View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.primaryContainer : colors.onSurfaceVariant },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Center Button (Wallet) - Positioned fully inside the parent container */}
      <Animated.View
        style={[
          styles.floatingButtonContainer,
          { transform: [{ scale: walletScaleVal }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handleWalletPressIn}
          onPressOut={handleWalletPressOut}
          style={[
            styles.floatingButton,
            isWalletFocused && styles.floatingButtonActive,
          ]}
        >
          <Ionicons
            name={isWalletFocused ? "wallet" : "wallet-outline"}
            size={44}
            color={colors.onPrimary}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const getStyles = (colors: typeof LIGHT_COLORS) => StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    position: "absolute",
    top: 30, 
    paddingTop: 10,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  spacer: {
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  floatingButtonContainer: {
    position: "absolute",
    top: 0,
    left: (width - 84) / 2,
    width: 84,
    height: 84,
    zIndex: 10,
  },
  floatingButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3.5,
    borderColor: colors.surface,
  },
  floatingButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.surface,
    shadowColor: colors.primaryContainer,
    shadowOpacity: 0.4,
  },
});
