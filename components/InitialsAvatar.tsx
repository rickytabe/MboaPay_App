import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/Theme';

interface InitialsAvatarProps {
  name: string;
  size?: number;
}

export default function InitialsAvatar({ name, size = 40 }: InitialsAvatarProps) {
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
      }
    ]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  text: {
    color: '#ffffff',
    fontWeight: 'bold',
  }
});
