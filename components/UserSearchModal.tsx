import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { COLORS, ROUNDED, SPACING } from "../constants/Theme";

interface UserSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser: (user: { id: string; full_name: string; phone: string; avatar_url?: string }) => void;
}

export default function UserSearchModal({ visible, onClose, onSelectUser }: UserSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setResults([]);
    }
  }, [visible]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, full_name, phone, avatar_url")
          .ilike("full_name", `%${query}%`)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => onSelectUser(item)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{item.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userPhone}>{item.phone}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.outline} />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Search MboaPay User</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.outline} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                {query.length > 1 ? (
                  <Text style={styles.emptyText}>No users found for "{query}"</Text>
                ) : (
                  <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
                )}
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
    margin: SPACING.md,
    paddingHorizontal: 12,
    borderRadius: ROUNDED.md,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: COLORS.primary,
  },
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: ROUNDED.md,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
});
