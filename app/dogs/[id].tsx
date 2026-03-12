import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Platform, Image } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

import type { Dog } from '../(tabs)/dogs';

export default function DogDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDog() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setDog(data);
      } catch (error) {
        console.error('Error fetching dog details:', error);
        Alert.alert('Erreur', 'Impossible de charger les informations du chien.');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchDog();
  }, [id]);

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vraiment supprimer ce chien ?')) {
        deleteDog();
      }
    } else {
      Alert.alert(
        'Supprimer le chien',
        'Voulez-vous vraiment supprimer ce chien ? Cette action est irréversible.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: deleteDog }
        ]
      );
    }
  };

  const deleteDog = async () => {
    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      router.back();
    } catch (error) {
      console.error('Error deleting dog:', error);
      Alert.alert('Erreur', 'Impossible de supprimer le chien.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Chargement...</Text>
      </View>
    );
  }

  if (!dog) return null;

  const isOwner = user?.id === dog.owner_id;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={[{ color: theme.tint, fontSize: 16 }]}>Retour</Text>
         </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.icon + '40' }]}>
          {dog.photo_url ? (
            <Image source={{ uri: dog.photo_url }} style={{ width: 120, height: 120, borderRadius: 60 }} />
          ) : (
            <IconSymbol name="pawprint.fill" size={60} color={theme.icon} />
          )}
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{dog.name}</Text>
        <Text style={[styles.breed, { color: theme.icon }]}>{dog.breed || 'Race non précisée'}</Text>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#f9f9f9', borderColor: theme.icon }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.text }]}>{dog.age ? `${dog.age} ans` : '-'}</Text>
          <Text style={[styles.statLabel, { color: theme.icon }]}>Âge</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.icon }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.text }]}>{dog.weight ? `${dog.weight} kg` : '-'}</Text>
          <Text style={[styles.statLabel, { color: theme.icon }]}>Poids</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Caractère et informations</Text>
        <Text style={[styles.sectionContent, { color: theme.text, backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#f9f9f9' }]}>
          {dog.character || "Aucune information supplémentaire n'a été fournie sur ce chien."}
        </Text>
      </View>

      {isOwner && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
          >
            <IconSymbol name="trash.fill" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  breed: {
    fontSize: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 15,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    opacity: 0.2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    padding: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actions: {
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    height: 50,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
