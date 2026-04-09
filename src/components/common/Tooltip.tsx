import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface TooltipProps {
  children: React.ReactNode;
  tooltip: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ children, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  const handleLongPress = () => {
    setShowTooltip(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltip = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowTooltip(false));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        onPress={hideTooltip}
        delayLongPress={500}
      >
        {children}
      </TouchableOpacity>
      {showTooltip && (
        <Animated.View style={[styles.tooltip, { opacity }]}>
          <Text style={styles.tooltipText}>{tooltip}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    bottom: '120%',
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 1000,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
});