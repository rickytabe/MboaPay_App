import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Modal, Share } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { COLORS, TYPOGRAPHY, SPACING, ROUNDED } from "../constants/Theme";
import TopNavBarComponent from "../components/TopNavBarComponent";
import Button from "../components/Button";
import Card from "../components/Card";
import * as Clipboard from 'expo-clipboard';

const FREQUENCIES: { id: 'daily'|'weekly'|'monthly', label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' }
];

const CIRCLE_TYPES: { id: 'solo'|'pool'|'rotation', label: string, desc: string }[] = [
  { id: 'solo', label: 'Solo savings', desc: 'Save toward your own goal, no group needed' },
  { id: 'pool', label: 'Group pool', desc: 'Save together, everyone keeps their own progress' },
  { id: 'rotation', label: 'Tontine (Rotation)', desc: 'Classic njangi — take turns receiving the pot' }
];

const DEPOSIT_PRESETS = [10, 15, 20];

export default function CreateCircle() {
  const router = useRouter();
  const { createCircle } = useApp();
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [circleType, setCircleType] = useState<'solo'|'pool'|'rotation'>('pool');
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [contribution, setContribution] = useState("");
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'monthly'>('monthly');
  const [maxMembers, setMaxMembers] = useState("10");
  const [visibility, setVisibility] = useState<'public'|'private'>('private');
  
  // Rotation Settings
  const [requireDeposit, setRequireDeposit] = useState(true);
  const [depositPct, setDepositPct] = useState(15);

  // Status State
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{name: string, code: string} | null>(null);

  // Projection Logic
  const goalNum = parseFloat(goal) || 0;
  const contribNum = parseFloat(contribution) || 0;
  
  const getProjectionText = () => {
    if (contribNum <= 0) return "Enter a contribution amount to see your timeline.";
    if (goalNum <= 0) return "Set a target pool to calculate your timeline.";
    
    const cycles = Math.ceil(goalNum / contribNum);
    if (cycles === Infinity || isNaN(cycles)) return "";

    let totalDays = cycles;
    if (frequency === 'weekly') totalDays = cycles * 7;
    if (frequency === 'monthly') totalDays = cycles * 30;

    let timeString = "";
    if (totalDays < 7) {
      timeString = `${totalDays} days`;
    } else if (totalDays < 30) {
      timeString = `${Math.ceil(totalDays / 7)} weeks`;
    } else {
      timeString = `${Math.ceil(totalDays / 30)} months`;
    }

    return `At ${contribNum.toLocaleString()} XAF ${frequency}, you'll reach ${goalNum.toLocaleString()} XAF in approximately ${timeString}.`;
  };

  const depositAmount = contribNum > 0 ? contribNum * (depositPct / 100) : 0;

  // Validation
  const isStep2Valid = name.trim().length > 0 && goalNum > 0;
  const isStep3Valid = contribNum > 0;
  const isStep4Valid = parseInt(maxMembers) >= 2;

  const handleNext = () => {
    if (step === 3 && circleType === 'solo') {
      setStep(5); // Skip step 4
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else if (step === 5 && circleType === 'solo') {
      setStep(3);
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalMaxMembers = circleType === 'solo' ? 1 : parseInt(maxMembers);
      const finalCommitmentPct = (circleType === 'rotation' && requireDeposit) ? depositPct : 0;
      
      const newCircle = await createCircle(
        name.trim(), 
        circleType, 
        goalNum, 
        contribNum, 
        frequency, 
        finalMaxMembers, 
        visibility,
        finalCommitmentPct
      );
      
      setSuccessData(newCircle);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to create savings circle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Invite code copied to clipboard!");
  };

  const handleShare = async () => {
    if (!successData) return;
    try {
      await Share.share({
        message: `Join my MboaPay circle "${successData.name}"!\n\nUse invite code: ${successData.code}\n\nDownload MboaPay to get started.`,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  // Rendering Steps
  const renderStep1 = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Choose a circle type</Text>
      <Text style={styles.stepSubtitle}>How do you want to save?</Text>
      
      <View style={styles.cardsContainer}>
        {CIRCLE_TYPES.map((type) => {
          const isSelected = circleType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              activeOpacity={0.8}
              style={[styles.typeCard, isSelected && styles.typeCardSelected]}
              onPress={() => {
                setCircleType(type.id);
                // The prompt says "Next button enabled as soon as any type is selected"
                // Let's actually auto-advance them. Well, the prompt says "it's a confirmation step".
                // We'll let them press Next manually.
              }}
            >
              <View style={styles.typeCardHeader}>
                <Text style={[styles.typeCardTitle, isSelected && styles.typeCardTitleSelected]}>{type.label}</Text>
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
              <Text style={styles.typeCardDesc}>{type.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Name & Target</Text>
      <Text style={styles.stepSubtitle}>What are you saving for?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Circle Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dschang Alumni Savings"
          placeholderTextColor={COLORS.outline}
          value={name}
          onChangeText={setName}
        />
        {name.length > 0 && name.trim().length === 0 && (
          <Text style={styles.errorText}>Name cannot be empty.</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Pool (XAF)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 500000"
          placeholderTextColor={COLORS.outline}
          keyboardType="numeric"
          value={goal}
          onChangeText={setGoal}
        />
        {goal.length > 0 && goalNum <= 0 && (
          <Text style={styles.errorText}>Target amount must be greater than 0.</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Contribution Schedule</Text>
      <Text style={styles.stepSubtitle}>How much and how often will you save?</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Contribution Amount (XAF)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 50000"
          placeholderTextColor={COLORS.outline}
          keyboardType="numeric"
          value={contribution}
          onChangeText={setContribution}
        />
        {contribution.length > 0 && contribNum <= 0 && (
          <Text style={styles.errorText}>Contribution amount must be greater than 0.</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map((freq) => (
            <TouchableOpacity
              key={freq.id}
              style={[
                styles.freqButton,
                frequency === freq.id && styles.freqButtonSelected,
              ]}
              onPress={() => setFrequency(freq.id)}
            >
              <Text
                style={[
                  styles.freqText,
                  frequency === freq.id && styles.freqTextSelected,
                ]}
              >
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.projectionBox}>
        <Ionicons name="trending-up-outline" size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
        <Text style={styles.projectionText}>{getProjectionText()}</Text>
      </View>
    </View>
  );

  const renderStep4 = () => {
    if (circleType === 'solo') return null;

    return (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Group Settings</Text>
      <Text style={styles.stepSubtitle}>Configure the rules for your circle.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Maximum Members</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 10"
          placeholderTextColor={COLORS.outline}
          keyboardType="numeric"
          value={maxMembers}
          onChangeText={setMaxMembers}
        />
        {maxMembers.length > 0 && parseInt(maxMembers) < 2 && (
          <Text style={styles.errorText}>Group circles must have at least 2 members.</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.freqRow}>
          <TouchableOpacity
            style={[styles.freqButton, visibility === 'private' && styles.freqButtonSelected]}
            onPress={() => setVisibility('private')}
          >
            <Text style={[styles.freqText, visibility === 'private' && styles.freqTextSelected]}>Private</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.freqButton, visibility === 'public' && styles.freqButtonSelected]}
            onPress={() => setVisibility('public')}
          >
            <Text style={[styles.freqText, visibility === 'public' && styles.freqTextSelected]}>Public</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helpText}>
          {visibility === 'public' 
            ? "Anyone can find and join this group from the Explore tab." 
            : "Only people with the invite code can join this group."}
        </Text>
      </View>

      {circleType === 'rotation' && (
        <View style={styles.depositSection}>
          <View style={styles.depositHeader}>
            <Text style={styles.label}>Require a joining deposit</Text>
            <TouchableOpacity 
              style={[styles.toggleSwitch, requireDeposit && styles.toggleSwitchActive]}
              onPress={() => setRequireDeposit(!requireDeposit)}
            >
              <View style={[styles.toggleKnob, requireDeposit && styles.toggleKnobActive]} />
            </TouchableOpacity>
          </View>
          
          {requireDeposit && (
            <View style={styles.depositControls}>
              <View style={styles.freqRow}>
                {DEPOSIT_PRESETS.map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={[styles.chipButton, depositPct === pct && styles.chipButtonSelected]}
                    onPress={() => setDepositPct(pct)}
                  >
                    <Text style={[styles.chipText, depositPct === pct && styles.chipTextSelected]}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.depositComputedText}>
                New members will pay a <Text style={{fontWeight: '700', color: COLORS.primary}}>{depositAmount.toLocaleString()} XAF</Text> commitment deposit to join.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
  };

  const renderStep5 = () => (
    <View style={styles.formSection}>
      <Text style={styles.stepTitle}>Review & Create</Text>
      <Text style={styles.stepSubtitle}>Verify your circle details before launching.</Text>

      <Card style={styles.reviewCard} variant="outlined" noPadding>
        <View style={styles.reviewContent}>
          
          <View style={styles.reviewRow}>
            <View style={styles.reviewCol}>
              <Text style={styles.reviewLabel}>Circle Name</Text>
              <Text style={styles.reviewValue}>{name}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(2)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.reviewRow}>
            <View style={styles.reviewCol}>
              <Text style={styles.reviewLabel}>Type</Text>
              <Text style={styles.reviewValue}>{CIRCLE_TYPES.find(t => t.id === circleType)?.label}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.reviewRow}>
            <View style={styles.reviewCol}>
              <Text style={styles.reviewLabel}>Target & Contribution</Text>
              <Text style={styles.reviewValue}>{goalNum.toLocaleString()} XAF Goal</Text>
              <Text style={styles.reviewSubValue}>{contribNum.toLocaleString()} XAF {frequency}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep(3)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          {circleType !== 'solo' && (
            <>
              <View style={styles.reviewRow}>
                <View style={styles.reviewCol}>
                  <Text style={styles.reviewLabel}>Group Settings</Text>
                  <Text style={styles.reviewValue}>{maxMembers} Members Max</Text>
                  <Text style={styles.reviewSubValue}>{visibility === 'public' ? 'Publicly Visible' : 'Private via Invite Code'}</Text>
                </View>
                <TouchableOpacity onPress={() => setStep(4)}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {circleType === 'rotation' && (
            <View style={styles.reviewRow}>
              <View style={styles.reviewCol}>
                <Text style={styles.reviewLabel}>Joining Deposit</Text>
                <Text style={styles.reviewValue}>
                  {requireDeposit ? `${depositPct}% (${depositAmount.toLocaleString()} XAF)` : "No deposit required"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStep(4)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </Card>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardContainer}
    >
      <View style={styles.safeArea}>
        <View style={styles.navHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Create Circle</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Step {circleType === 'solo' && step === 5 ? 4 : step} of {circleType === 'solo' ? 4 : 5}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(step / (circleType === 'solo' ? 4 : 5)) * 100}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          <View style={styles.bottomSection}>
            {step < totalSteps ? (
              <Button
                title="Next"
                onPress={handleNext}
                disabled={
                  (step === 2 && !isStep2Valid) || 
                  (step === 3 && !isStep3Valid) || 
                  (step === 4 && !isStep4Valid)
                }
                type="primary"
              />
            ) : (
              <Button
                title="Launch Savings Circle"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                type="primary"
              />
            )}
          </View>
        </ScrollView>
      </View>

      {/* Full-screen Success Modal */}
      <Modal visible={!!successData} animationType="slide" transparent={false}>
        <View style={styles.successModal}>
          <View style={styles.successContent}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.secondary} />
            </View>
            <Text style={styles.successTitle}>Circle Created!</Text>
            <Text style={styles.successSubtitle}>
              {circleType === 'solo' 
                ? `${successData?.name} is ready. You can now start saving towards your goal!` 
                : `${successData?.name} is ready. Share this invite code with the members you want to join.`}
            </Text>

            {circleType !== 'solo' && (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{successData?.code}</Text>
                
                <View style={styles.actionRow}>
                  <TouchableOpacity onPress={() => copyToClipboard(successData?.code || '')} style={styles.iconButton}>
                    <Ionicons name="copy-outline" size={20} color={COLORS.primaryContainer} />
                    <Text style={styles.iconButtonText}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                    <Ionicons name="share-outline" size={20} color={COLORS.primaryContainer} />
                    <Text style={styles.iconButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.successFooter}>
            <Button
              title="Go to Circles"
              onPress={() => {
                setSuccessData(null);
                router.replace("/(tabs)/circles");
              }}
              type="primary"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: 50,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    height: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 2,
  },
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 40,
  },
  formSection: {
    flex: 1,
    paddingTop: 20,
    gap: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardsContainer: {
    gap: 12,
  },
  typeCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceContainerHigh,
    borderRadius: ROUNDED.lg,
    padding: 16,
  },
  typeCardSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer + "08",
  },
  typeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  typeCardTitleSelected: {
    color: COLORS.primaryContainer,
  },
  typeCardDesc: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    paddingRight: 30,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.primaryContainer,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primaryContainer,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  input: {
    height: 54,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    color: COLORS.primary,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
    marginTop: -2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  freqRow: {
    flexDirection: "row",
    gap: 10,
  },
  freqButton: {
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.md,
  },
  freqButtonSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer + "10",
  },
  freqText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  freqTextSelected: {
    color: COLORS.primaryContainer,
    fontWeight: "700",
  },
  chipButton: {
    paddingHorizontal: 16,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: ROUNDED.full,
  },
  chipButtonSelected: {
    borderColor: COLORS.primaryContainer,
    backgroundColor: COLORS.primaryContainer + "10",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.onSurfaceVariant,
  },
  chipTextSelected: {
    color: COLORS.primaryContainer,
    fontWeight: "700",
  },
  projectionBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + "0A",
    padding: 16,
    borderRadius: ROUNDED.md,
    gap: 10,
  },
  projectionText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 4,
    fontStyle: 'italic'
  },
  depositSection: {
    marginTop: 10,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: ROUNDED.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    gap: 16,
  },
  depositHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },
  depositControls: {
    gap: 12,
  },
  depositComputedText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  reviewCard: {
    backgroundColor: COLORS.surface,
  },
  reviewContent: {
    padding: 16,
    gap: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewCol: {
    flex: 1,
  },
  reviewLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  reviewSubValue: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  editLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryContainer,
    paddingLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  bottomSection: {
    marginTop: 30,
  },
  successModal: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 80,
    paddingBottom: 50,
  },
  successContent: {
    alignItems: 'center',
    gap: 16,
  },
  successIconCircle: {
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  successSubtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  codeBox: {
    marginTop: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryContainer + "40",
    borderRadius: ROUNDED.md,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryContainer + "10",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDED.full,
  },
  iconButtonText: {
    color: COLORS.primaryContainer,
    fontWeight: '700',
    fontSize: 14,
  },
  successFooter: {
    width: '100%',
  }
});
