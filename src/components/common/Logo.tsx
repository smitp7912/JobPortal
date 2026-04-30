import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showIcon?: boolean;
  color?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', onPress, showIcon = true, color = '#2563EB' }) => {
  const fontSize = size === 'small' ? 18 : size === 'large' ? 32 : 24;
  const iconSize = size === 'small' ? 20 : size === 'large' ? 36 : 28;

  const content = (
    <View style={styles.container}>
      {showIcon && <Icon name="work" size={iconSize} color={color} style={styles.icon} />}
      <Text style={[styles.text, { fontSize, color }]}>hireHub</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontWeight: 'bold',
    color: '#2563EB',
  },
});