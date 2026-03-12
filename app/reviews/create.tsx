import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating } from '@/components/ui/StarRating';

export default function CreateReviewScreen() {
  const { sittingId, revieweeId, revieweeName } = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submitReview = async () => {
    if (!user || !sittingId || !revieweeId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('reviews').insert([
        {
          sitting_id: sittingId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim() || null
        }
      ]);

      // Handle duplicate review or other errors
      if (error) throw error;

      if(Platform.OS !== 'web') Alert.alert('Merci !', 'Votre avis a bien été enregistré.');
      router.back();
      
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur', error.message || "Impossible d'enregistrer l'avis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Laisser un avis</Text>
      <Text style={[styles.subtitle, { color: theme.icon }]}>
        Comment s'est passée la garde avec {revieweeName || 'cet utilisateur'} ?
      </Text>

      <View style={styles.ratingContainer}>
        <StarRating 
          rating={rating} 
          onRatingChange={setRating} 
          size={40} 
        />
        <Text style={[styles.ratingText, { color: theme.text }]}>
          {rating} / 5
        </Text>
      </View>

      <Text style={[styles.label, { color: theme.text }]}>Un mot à ajouter ? (Optionnel)</Text>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.icon, backgroundColor: theme.background }]}
        multiline
        numberOfLines={4}
        placeholder="Ce dog sitter était super, ponctuel et très sympa..."
        placeholderTextColor={theme.icon}
        value={comment}
        onChangeText={setComment}
        textAlignVertical="top"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.skipButton, { borderColor: theme.icon }]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.text }]}>Plus tard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.submitButton, { backgroundColor: theme.tint }]}
          onPress={submitReview}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            {loading ? 'Envoi...' : 'Envoyer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  ratingText: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    minHeight: 120,
    fontSize: 16,
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
