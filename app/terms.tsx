import React from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'CGU', headerBackTitle: 'Retour' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Conditions Générales d'Utilisation</Text>
        
        <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Objet du service</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          DogShare est une plateforme mettant en relation des particuliers pour l'échange de services de garde de chiens. Le service est basé sur un système de "crédits" et n'implique aucune transaction financière directe entre les utilisateurs via l'application.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Engagement des utilisateurs</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Les utilisateurs s'engagent à fournir des informations véridiques sur eux-mêmes et sur leurs animaux. En tant que gardien, vous vous engagez à prendre soin du chien qui vous est confié et à respecter les consignes de son propriétaire.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Système de crédits</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Les gardes sont rémunérées virtuellement par des crédits. Gagnez des crédits en gardant un chien, et dépensez-les pour faire garder le vôtre. Les crédits n'ont aucune valeur monétaire réelle.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Responsabilité</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          DogShare agit en tant que simple intermédiaire de mise en relation et décline toute responsabilité en cas de dommages, de perte, de vol, de maladie ou de blessure de l'animal pendant une garde. Il est recommandé aux utilisateurs de vérifier que leur assurance responsabilité civile les couvre pour ces situations.
        </Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Résiliation du compte</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          DogShare se réserve le droit de suspendre ou de supprimer le compte de tout utilisateur ne respectant pas les présentes CGU, ou recevant des signalements répétés pour comportement inapproprié ou mauvais traitement envers les animaux.
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
