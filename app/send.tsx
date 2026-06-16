import * as Contacts from 'expo-contacts';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Card from "../components/Card";
import TopNavBarComponent from "../components/TopNavBarComponent";
import UserSearchModal from "../components/UserSearchModal";
import { COLORS, ROUNDED, SPACING } from "../constants/Theme";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";
import { Ionicons } from '@expo/vector-icons';

export default function Send() {
  const router = useRouter();
  const { sendMoney, walletBalance } = useApp();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedOperator, setDetectedOperator] = useState<"MTN" | "Orange" | null>(null);

  // Auto-detect operator based on first 3 digits after 237 or 6
  useEffect(() => {
    const clean = phone.replace(/[^0-9]/g, '');
    let prefix = '';
    
    if (clean.length >= 9) {
        if (clean.startsWith('237')) {
            prefix = clean.substring(3, 5);
        } else {
            prefix = clean.substring(0, 2);
        }
        
        if (['67', '65', '68'].includes(prefix) || prefix.startsWith('7') || prefix.startsWith('8')) {
            setDetectedOperator("MTN");
        } else if (['69', '66'].includes(prefix) || prefix.startsWith('9')) {
            setDetectedOperator("Orange");
        } else {
            setDetectedOperator(null);
        }
    } else {
        setDetectedOperator(null);
    }
  }, [phone]);

  useEffect(() => {
    let active = true;

    const lookupRecipient = async () => {
      const clean = phone.replace(/[^0-9]/g, '');
      if (clean.length < 9) {
        setRecipientName("");
        return;
      }

      const finalPhone = clean.startsWith('237') ? clean : `237${clean}`;
      const phonePlus = `+${finalPhone}`;
      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .or(`phone.eq.${finalPhone},phone.eq.${phonePlus}`)
        .maybeSingle();

      if (!active) return;
      if (!error && data?.full_name) {
        setRecipientName(data.full_name);
      } else {
        setRecipientName("");
      }
    };

    lookupRecipient();
    return () => {
      active = false;
    };
  }, [phone]);

  const handleSend = async () => {
    Keyboard.dismiss();
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid amount to send.");
        return;
    }
    if (value > walletBalance) {
        Alert.alert("Insufficient Funds", "You do not have enough balance to send this amount.");
        return;
    }
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 9) {
        Alert.alert("Invalid Phone", "Please enter a valid recipient phone number.");
        return;
    }

    const finalPhone = cleanPhone.startsWith('237') ? cleanPhone : `237${cleanPhone}`;
    const finalOperator = detectedOperator;
    
    if (!finalOperator) {
        Alert.alert("Invalid Network", "Please enter a valid MTN or Orange Cameroon number.");
        return;
    }

    setLoading(true);
    
    try {
        const txId = await sendMoney(value, finalPhone, finalOperator, note.trim() || "MboaPay Transfer");
        
        router.replace({
            pathname: "/transaction-receipt",
            params: {
              txId,
              amount: value,
              operator: finalOperator,
              recipientName: recipientName || finalPhone,
              recipientPhone: finalPhone,
              type: "disbursement",
              title: "Transfer Successful",
            },
        });
    } catch (err: any) {
        Alert.alert("Transfer Failed", err.message);
    } finally {
        setLoading(false);
    }
  };

  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [contactsList, setContactsList] = useState<Contacts.Contact[]>([]);

  const openContacts = async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        if (data.length > 0) {
          setContactsList(data);
          setContactsModalVisible(true);
        } else {
          Alert.alert("No Contacts", "Could not find any contacts on your device.");
        }
      } else {
        Alert.alert("Permission Denied", "We need contacts permission to pick a contact.");
      }
  };

  const selectContact = (contact: Contacts.Contact) => {
      setContactsModalVisible(false);
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          const rawPhone = contact.phoneNumbers[0].number || "";
          const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
          let finalNumber = cleanPhone;
          if (cleanPhone.startsWith('237') && cleanPhone.length > 9) {
              finalNumber = cleanPhone.substring(3);
          } else if (cleanPhone.length > 9) {
              finalNumber = cleanPhone.substring(cleanPhone.length - 9);
          }
          setPhone(finalNumber);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }} keyboardShouldPersistTaps="handled">
            
            <View style={styles.header}>
              <TopNavBarComponent showBack title="Send Money" />
            </View>

            <View style={styles.content}>
              {/* Balance Card */}
              <Card variant="primary" style={styles.balanceCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.activeBadgeContainer}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.tertiaryContainer} />
                    <Text style={styles.activeBadgeText}>Available for transfer</Text>
                  </View>
                  <Ionicons name="card-outline" size={20} color="#ffffff" style={{ opacity: 0.8 }} />
                </View>

                <View style={styles.balanceInfoContainer}>
                  <Text style={styles.balanceLabel}>Total Balance</Text>
                  <Text style={styles.balanceText}>{walletBalance.toLocaleString()} XAF</Text>
                </View>
              </Card>

              {/* Amount Input */}
              <View style={styles.inputContainer}>
                  <Text style={styles.label}>Amount (XAF)</Text>
                  <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                      placeholderTextColor={COLORS.onSurfaceVariant}
                      value={amount}
                      onChangeText={setAmount}
                  />
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                      <Text style={styles.label}>Recipient Phone Number</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={() => setSearchModalVisible(true)} style={styles.contactsButton}>
                              <Ionicons name="search" size={14} color={COLORS.primary} style={{marginRight: 4}} />
                              <Text style={styles.contactsButtonText}>Search Directory</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={openContacts} style={styles.contactsButton}>
                              <Ionicons name="people" size={14} color={COLORS.primary} style={{marginRight: 4}} />
                              <Text style={styles.contactsButtonText}>Contacts</Text>
                          </TouchableOpacity>
                      </View>
                  </View>
                  <View style={styles.inputCard}> 
                      <TextInput
                              style={styles.inputInCard}
                              keyboardType="phone-pad"
                              placeholder="e.g. 653 456 789"
                              placeholderTextColor={COLORS.onSurfaceVariant}
                              value={phone}
                              onChangeText={setPhone}
                              maxLength={9}
                          />
                      <View style={styles.checkCircle}>
                          {detectedOperator ? (
                              detectedOperator === "MTN" ? (
                                  <Image
                                      source={{ uri: "https://i.pinimg.com/1200x/02/cb/c3/02cbc305b506ea1ffcd73028d59df80b.jpg" }}
                                      style={styles.providerLogo}
                                      resizeMode="contain"
                                  />
                              ) : (
                                  <Image
                                      source={{ uri: "https://i.pinimg.com/736x/92/92/87/929287df7958f0e3043aef7a0f707c2f.jpg" }}
                                      style={styles.providerLogo}
                                      resizeMode="contain"
                                  />
                              )
                          ) : (
                              <Text style={{ color: COLORS.onSurfaceVariant, fontWeight: '700' }}>+</Text>
                          )}
                      </View>
                  </View>
                  {recipientName ? (
                    <Text style={styles.recipientText}>Recipient: {recipientName}</Text>
                  ) : null}
              </View>

              {/* Note Input */}
              <View style={styles.inputContainer}>
                  <Text style={styles.label}>Description (Optional)</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="What is this for?"
                      placeholderTextColor={COLORS.onSurfaceVariant}
                      value={note}
                      onChangeText={setNote}
                      maxLength={50}
                  />
              </View>
            </View>

            <View style={styles.bottomSection}>
              <Button
                title={`Send ${amount ? parseFloat(amount).toLocaleString() : '0'} XAF`}
                onPress={handleSend}
                disabled={amount === "" || phone === "" || loading}
                loading={loading}
                type="primary"
              />
            </View>

          </ScrollView>
      </KeyboardAvoidingView>
      <UserSearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelectUser={(u: any) => {
          setPhone(u.phone.replace('+237', ''));
          setRecipientName(u.full_name);
          setSearchModalVisible(false);
        }}
      />

      {/* Contacts Modal */}
      <Modal visible={contactsModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Contact</Text>
                      <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                          <Text style={styles.modalCloseText}>Close</Text>
                      </TouchableOpacity>
                  </View>
                  <FlatList
                      data={contactsList}
                      keyExtractor={(item, index) => `${item.name || 'contact'}-${index}`}
                      renderItem={({ item }) => (
                          <TouchableOpacity style={styles.contactItem} onPress={() => selectContact(item)}>
                              <Text style={styles.contactName}>{item.name}</Text>
                              {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                                  <Text style={styles.contactPhone}>{item.phoneNumbers[0].number}</Text>
                              )}
                          </TouchableOpacity>
                      )}
                  />
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 44,
  },
  content: {
    paddingHorizontal: SPACING.containerPadding,
    marginTop: 20,
    flex: 1,
  },
  balanceCard: {
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 204, 0, 0.18)", // Semi-transparent Gold
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: ROUNDED.full,
    gap: 4,
  },
  activeBadgeText: {
    color: COLORS.tertiaryContainer,
    fontSize: 11,
    fontWeight: "700",
  },
  balanceInfoContainer: {
    marginTop: 20,
    marginBottom: 4,
  },
  balanceLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  balanceText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  inputContainer: {
      marginBottom: 20,
  },
  labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  label: {
      fontSize: 13,
      fontWeight: "700",
      color: COLORS.primary,
  },
  detectedOperator: {
      fontSize: 12,
      fontWeight: '700',
  },
  providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  providerLogo: {
      width: 26,
      height: 26,
      borderRadius: 13,
  },
  recipientText: {
      fontSize: 13,
      color: COLORS.onSurfaceVariant,
      marginTop: 8,
  },
  input: {
      backgroundColor: COLORS.surface,
      borderRadius: ROUNDED.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: COLORS.primary,
      fontWeight: '600',
  },
  inputCard: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: COLORS.surface, borderRadius: ROUNDED.md, borderWidth: 1, borderColor: COLORS.outlineVariant, paddingHorizontal: 12 },
  inputInCard: { flex: 1, fontSize: 16, color: COLORS.primary, paddingVertical: 10 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondaryContainer, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  contactsButton: {
      backgroundColor: COLORS.surfaceContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: ROUNDED.sm,
  },
  contactsButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.primary,
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: COLORS.background,
      borderTopLeftRadius: ROUNDED.xl,
      borderTopRightRadius: ROUNDED.xl,
      height: '70%',
      padding: SPACING.containerPadding,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.outlineVariant,
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.primary,
  },
  modalCloseText: {
      fontSize: 16,
      color: COLORS.primary,
      fontWeight: '600',
  },
  contactItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.outlineVariant,
  },
  contactName: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.primary,
      marginBottom: 4,
  },
  contactPhone: {
      fontSize: 14,
      color: COLORS.onSurfaceVariant,
  },
  bottomSection: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 24,
  },
});
