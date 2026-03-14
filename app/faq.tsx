import React from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Stack } from 'expo-router';

export default function FAQScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ title: 'Foire Aux Questions', headerBackTitle: 'Retour' }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Comment ça marche ?</Text>
        
        <View style={styles.faqItem}>
          <Text style={[styles.question, { color: theme.text }]}>Qu'est-ce que OOAFF ?</Text>
          <Text style={[styles.answer, { color: theme.text }]}>
            OOAFF est une application d'échange de gardes de chiens entre particuliers. Elle permet aux propriétaires de chiens de s'entraider en gardant les chiens des autres plutôt que de payer des pensions coûteuses.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={[styles.question, { color: theme.text }]}>Comment fonctionne le système de crédits ?</Text>
          <Text style={[styles.answer, { color: theme.text }]}>
            L'application fonctionne avec une monnaie virtuelle : les crédits. 
            Vous gagnez des crédits lorsque vous gardez le chien d'un autre utilisateur. 
            Vous dépensez vos crédits lorsque vous confiez votre chien à quelqu'un. 
            Aucune transaction financière n'a lieu sur la plateforme.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={[styles.question, { color: theme.text }]}>Comment obtenir mes premiers crédits ?</Text>
          <Text style={[styles.answer, { color: theme.text }]}>
            Lors de votre inscription, vous recevez généralement un solde de départ pour vous encourager à utiliser la plateforme. Pour en gagner d'autres, il vous suffit de proposer vos services de garde !
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={[styles.question, { color: theme.text }]}>Comment trouver un gardien près de chez moi ?</Text>
          <Text style={[styles.answer, { color: theme.text }]}>
            Rendez-vous sur l'onglet "Explorer" (ou la carte) de l'application. Vous y verrez les demandes de garde autour de vous. C'est également ici que vos demandes de garde apparaîtront pour les autres utilisateurs.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={[styles.question, { color: theme.text }]}>Comment valider une garde terminée ?</Text>
          <Text style={[styles.answer, { color: theme.text }]}>
            Une fois la garde effectuée, vous pouvez confirmer que tout s'est bien passé depuis l'onglet de vos demandes. Les crédits prévus seront alors automatiquement transférés au gardien.
          </Text>
        </View>

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
  faqItem: {
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 15,
    borderRadius: 10,
  },
  question: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  answer: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.9,
  },
  footer: {
    height: 40,
  }
});
