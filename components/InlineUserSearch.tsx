import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { COLORS, ROUNDED, SPACING } from "../constants/Theme";

interface InlineUserSearchProps {
  onSelectUser: (user: { id: string; full_name: string; phone: string; avatar_url?: string }) => void;
  placeholder?: string;
}

export default function InlineUserSearch({ onSelectUser, placeholder = "Search MboaPay User by Name..." }: InlineUserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("id, full_name, phone")
          .ilike("full_name", `%${query}%`)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("User search failed:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (user: any) => {
    onSelectUser(user);
    setQuery("");
    setResults([]);
    setIsFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
        <Ionicons name="search" size={20} color={isFocused ? COLORS.primary : COLORS.outline} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.outline}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.outline} />
          </TouchableOpacity>
        )}
      </View>

      {isFocused && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.resultItem}
              onPress={() => handleSelect(item)}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {item.full_name
                      ? item.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.full_name}</Text>
                <Text style={styles.userPhone}>{item.phone}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: ROUNDED.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  searchBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.primary,
  },
  dropdown: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: ROUNDED.md,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
});
