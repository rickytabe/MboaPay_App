import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, ROUNDED, TYPOGRAPHY } from "../constants/Theme";
import { useApp } from "../context/AppContext";

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  softColor: string;
  visual: "circles" | "escrow" | "wallet";
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Track your savings circle",
    description:
      "Create trusted tontines, follow every contribution, and know exactly when each round pays out.",
    icon: "account-group-outline",
    accentColor: COLORS.secondary,
    softColor: `${COLORS.secondaryContainer}33`,
    visual: "circles",
  },
  {
    id: "2",
    title: "Keep every franc protected",
    description:
      "Use escrow for deals, services, and shared goals so funds move only when everyone confirms.",
    icon: "shield-check-outline",
    accentColor: COLORS.primaryContainer,
    softColor: `${COLORS.primaryContainer}14`,
    visual: "escrow",
  },
  {
    id: "3",
    title: "Move money instantly",
    description:
      "Top up with Mobile Money, send payouts, and receive updates from one simple wallet.",
    icon: "cellphone-arrow-down",
    accentColor: COLORS.tertiaryContainer,
    softColor: `${COLORS.tertiaryContainer}2E`,
    visual: "wallet",
  },
];

function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <Text style={styles.brandLetter}>M</Text>
      </View>
      <Text style={styles.brandName}>MboaPay</Text>
    </View>
  );
}

function Dots({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={styles.dotsRow} accessible accessibilityLabel={`Slide ${activeIndex + 1} of ${slides.length}`}>
      {slides.map((slide, index) => (
        <View
          key={slide.id}
          style={[styles.dot, index === activeIndex ? styles.activeDot : styles.inactiveDot]}
        />
      ))}
    </View>
  );
}

function MiniPerson({
  color,
  side = "left",
}: {
  color: string;
  side?: "left" | "right";
}) {
  return (
    <View style={[styles.person, side === "right" && styles.personRight]}>
      <View style={styles.personHead} />
      <View style={[styles.personBody, { backgroundColor: color }]} />
      <View style={styles.personLegs} />
    </View>
  );
}

function Illustration({ slide }: { slide: OnboardingSlide }) {
  const renderVisual = () => {
    if (slide.visual === "circles") {
      return (
        <>
          <View style={styles.tableLine} />
          <MiniPerson color={COLORS.tertiaryContainer} />
          <View style={styles.ledgerCard}>
            <MaterialCommunityIcons name="calendar-check-outline" size={28} color={slide.accentColor} />
            <View style={styles.ledgerRows}>
              <View style={[styles.ledgerRow, { width: 44 }]} />
              <View style={[styles.ledgerRow, { width: 58 }]} />
              <View style={[styles.ledgerRow, { width: 36 }]} />
            </View>
          </View>
          <View style={[styles.floatBadge, styles.floatBadgeTop]}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.tertiary} />
          </View>
        </>
      );
    }

    if (slide.visual === "escrow") {
      return (
        <>
          <View style={styles.shieldBase}>
            <MaterialCommunityIcons name="shield-check-outline" size={76} color={slide.accentColor} />
          </View>
          <MiniPerson color={COLORS.primaryContainer} />
          <MiniPerson color={COLORS.tertiaryContainer} side="right" />
          <View style={styles.escrowBridge}>
            <View style={[styles.bridgeDot, { backgroundColor: COLORS.secondary }]} />
            <View style={styles.bridgeLine} />
            <View style={[styles.bridgeDot, { backgroundColor: COLORS.tertiaryContainer }]} />
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.phoneShell}>
          <View style={styles.phoneSpeaker} />
          <MaterialCommunityIcons name="wallet-outline" size={48} color={slide.accentColor} />
          <View style={styles.phoneFooter} />
        </View>
        <View style={[styles.floatBadge, styles.floatBadgeTop]}>
          <MaterialCommunityIcons name="bell-ring-outline" size={23} color={COLORS.primaryContainer} />
        </View>
        <View style={[styles.floatBadge, styles.floatBadgeBottom]}>
          <MaterialCommunityIcons name="cash-fast" size={24} color={COLORS.secondary} />
        </View>
      </>
    );
  };

  return (
    <View style={styles.illustrationFrame}>
      <View style={[styles.illustrationHalo, { backgroundColor: slide.softColor }]} />
      <View style={[styles.accentCircle, { borderColor: slide.accentColor }]} />
      <MaterialCommunityIcons
        name={slide.icon as any}
        size={48}
        color={slide.accentColor}
        style={styles.mainIcon}
      />
      {renderVisual()}
      <View style={styles.groundShadow} />
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const { user, hasAuthSession, isAuthLoading } = useApp();
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const isLastSlide = currentIndex === slides.length - 1;
  const isCompact = height < 720;

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (user.isLoggedIn || hasAuthSession) {
      router.replace("/(tabs)/home");
      return;
    }
  }, [hasAuthSession, isAuthLoading, router, user.isLoggedIn]);

  if (isAuthLoading || user.isLoggedIn || hasAuthSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryContainer} />
      </View>
    );
  }

  const completeOnboarding = () => {
    router.push("/register");
  };

  const goToNext = () => {
    if (isLastSlide) {
      completeOnboarding();
      return;
    }

    flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(Math.min(Math.max(nextIndex, 0), slides.length - 1));
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.card, isCompact && styles.compactCard]}>
        <View>
          <BrandMark />
          <Illustration slide={item} />
        </View>

        <View style={styles.copyBlock}>
          <Dots activeIndex={currentIndex} />
          <Text style={[styles.title, isCompact && styles.compactTitle]}>{item.title}</Text>
          <Text style={[styles.description, isCompact && styles.compactDescription]}>
            {item.description}
          </Text>
        </View>

        <View style={[styles.actionRow, isLastSlide && styles.finalActionRow]}>
          {!isLastSlide && (
            <TouchableOpacity
              onPress={completeOnboarding}
              activeOpacity={0.75}
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip onboarding"
            >
              <Text style={styles.skipText}>SKIP</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={goToNext}
            activeOpacity={0.86}
            style={[styles.nextButton, isLastSlide && styles.startButton]}
            accessibilityRole="button"
            accessibilityLabel={isLastSlide ? "Start registration" : "Next onboarding slide"}
          >
            <Text style={styles.nextText}>{isLastSlide ? "START" : "NEXT"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundLines} pointerEvents="none">
        <View style={[styles.arc, styles.arcTop]} />
        <View style={[styles.arc, styles.arcMiddle]} />
        <View style={[styles.arc, styles.arcBottom]} />
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        extraData={{ currentIndex, width, height }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  backgroundLines: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  arc: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: `${COLORS.primaryContainer}14`,
  },
  arcTop: {
    top: -270,
    left: -150,
    transform: [{ rotate: "12deg" }],
  },
  arcMiddle: {
    top: 80,
    right: -390,
    transform: [{ rotate: "-18deg" }],
  },
  arcBottom: {
    bottom: -330,
    left: 60,
    transform: [{ rotate: "20deg" }],
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flex: 1,
    width: "100%",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 30,
  },
  compactCard: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
  },
  brandRow: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: ROUNDED.default,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primaryContainer,
  },
  brandLetter: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  brandName: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  illustrationFrame: {
    width: "100%",
    height: 250,
    marginTop: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationHalo: {
    position: "absolute",
    width: 214,
    height: 214,
    borderRadius: 107,
    opacity: 0.96,
  },
  accentCircle: {
    position: "absolute",
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1,
    opacity: 0.13,
  },
  mainIcon: {
    position: "absolute",
    top: 90,
  },
  tableLine: {
    position: "absolute",
    top: 155,
    width: 168,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.onSurfaceVariant,
  },
  person: {
    position: "absolute",
    left: 70,
    bottom: 54,
    alignItems: "center",
  },
  personRight: {
    left: undefined,
    right: 66,
  },
  personHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },
  personBody: {
    width: 36,
    height: 52,
    marginTop: -2,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  personLegs: {
    width: 48,
    height: 22,
    marginTop: -4,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: COLORS.onSurfaceVariant,
  },
  ledgerCard: {
    position: "absolute",
    right: 48,
    top: 96,
    width: 86,
    height: 76,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  ledgerRows: {
    gap: 4,
    alignItems: "center",
  },
  ledgerRow: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
  },
  shieldBase: {
    width: 128,
    height: 128,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  escrowBridge: {
    position: "absolute",
    bottom: 70,
    flexDirection: "row",
    alignItems: "center",
  },
  bridgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bridgeLine: {
    width: 90,
    height: 3,
    backgroundColor: COLORS.outlineVariant,
  },
  phoneShell: {
    width: 112,
    height: 158,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.surfaceContainer,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  phoneSpeaker: {
    position: "absolute",
    top: 14,
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
  },
  phoneFooter: {
    position: "absolute",
    bottom: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  floatBadge: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  floatBadgeTop: {
    top: 42,
    right: 58,
  },
  floatBadgeBottom: {
    bottom: 42,
    left: 58,
  },
  groundShadow: {
    position: "absolute",
    bottom: 34,
    width: 190,
    height: 16,
    borderRadius: 95,
    backgroundColor: `${COLORS.primary}0F`,
  },
  copyBlock: {
    alignItems: "center",
  },
  dotsRow: {
    height: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activeDot: {
    backgroundColor: COLORS.onBackground,
  },
  inactiveDot: {
    borderWidth: 1,
    borderColor: COLORS.onSurfaceVariant,
    backgroundColor: "transparent",
  },
  title: {
    color: COLORS.onBackground,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36,
    textAlign: "center",
  },
  compactTitle: {
    fontSize: 24,
    lineHeight: 31,
  },
  description: {
    marginTop: 14,
    color: COLORS.onSurfaceVariant,
    fontSize: TYPOGRAPHY.bodyMd.fontSize,
    lineHeight: 21,
    textAlign: "center",
  },
  compactDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  finalActionRow: {
    justifyContent: "center",
  },
  skipButton: {
    minWidth: 72,
    height: 48,
    justifyContent: "center",
  },
  skipText: {
    color: COLORS.onBackground,
    fontSize: 13,
    fontWeight: "900",
  },
  nextButton: {
    minWidth: 96,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 26,
    backgroundColor: COLORS.primaryContainer,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  startButton: {
    minWidth: 198,
  },
  nextText: {
    color: COLORS.onPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
});
