import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from './icon-symbol';

export const StarRating = ({ 
  rating, 
  onRatingChange, 
  size = 24, 
  readonly = false 
}: {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={readonly}
          onPress={() => onRatingChange && onRatingChange(star)}
          activeOpacity={readonly ? 1 : 0.7}
        >
          <IconSymbol
            name={star <= rating ? "star.fill" : "star"}
            size={size}
            color={star <= rating ? "#FFD700" : "#ccc"}
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  }
});
