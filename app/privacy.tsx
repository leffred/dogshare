import React from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Politique de Confidentialité', headerBackTitle: 'Retour' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Politique de Confidentialité</Text>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Collecte des données</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Nous collectons les informations que vous nous fournissez lors de votre inscription (nom, email, adresse, etc.) ainsi que les données relatives à votre chien et à vos gardes.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Utilisation des données</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Vos données sont utilisées exclusivement pour le bon fonctionnement de l'application DogShare : mise en relation entre utilisateurs, gestion des crédits et localisation des gardes.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Partage des données</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Vos données personnelles ne sont jamais vendues à des tiers. Les informations de votre profil (prénom, distance, avis, informations sur les chiens) sont visibles par les autres utilisateurs de la plateforme afin de faciliter les échanges.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Sécurité</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Nous mettons en œuvre des mesures de sécurité pour protéger vos données contre tout accès non autorisé. La plateforme utilise les services sécurisés de Supabase pour le stockage des données et l'authentification.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Vos droits (RGPD)</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment en désactivant votre compte depuis les paramètres, ou en nous contactant.
        </Text>

        <View style={styles.footer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
    opacity: 0.9,
  },
  footer: {
    height: 40,
  }
});
