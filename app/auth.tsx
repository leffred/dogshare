import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Alert, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success'} | null>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
      if (Platform.OS !== 'web') Alert.alert('Erreur', error.message);
    }
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    setMessage(null);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
      if (Platform.OS !== 'web') Alert.alert('Erreur', error.message);
    } else if (!session) {
      setMessage({ text: 'Succès ! Veuillez vérifier votre boîte de réception pour confirmer votre email.', type: 'success' });
      if (Platform.OS !== 'web') Alert.alert('Succès', 'Veuillez vérifier votre boîte de réception pour confirmer votre email !');
    }
    setLoading(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={[styles.appName, { color: theme.tint }]}>OOAFF</Text>
        <Text style={[styles.description, { color: theme.text }]}>
          L'application d'échange de gardes de chiens entre particuliers. Confiez votre chien en toute sérénité ou gagnez des crédits en gardant ceux des autres !
        </Text>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>
        {isLogin ? 'Connexion' : 'Inscription'}
      </Text>

      {message && (
        <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
          <Text style={[styles.messageText, message.type === 'error' ? styles.messageTextError : styles.messageTextSuccess]}>
            {message.text}
          </Text>
        </View>
      )}
      
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          placeholderTextColor={theme.icon}
          autoCapitalize={'none'}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Mot de passe"
          placeholderTextColor={theme.icon}
          autoCapitalize={'none'}
        />
      </View>
      
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.tint }]}
          onPress={() => isLogin ? signInWithEmail() : signUpWithEmail()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {isLogin ? 'Se connecter' : "S'inscrire"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.verticallySpaced}>
        <TouchableOpacity 
          onPress={() => setIsLogin(!isLogin)}
          style={styles.switchButton}
        >
          <Text style={[styles.switchText, { color: theme.tint }]}>
            {isLogin 
              ? "Pas encore de compte ? S'inscrire" 
              : "Déjà un compte ? Se connecter"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legalContainer}>
        <Text style={[styles.legalText, { color: theme.icon }]}>
          En continuant, vous acceptez nos{' '}
          <Text onPress={() => router.push('/terms' as any)} style={[styles.legalLink, { color: theme.tint }]}>CGU</Text>
          {' '}et notre{' '}
          <Text onPress={() => router.push('/privacy' as any)} style={[styles.legalLink, { color: theme.tint }]}>Politique de confidentialité</Text>.
        </Text>
        <TouchableOpacity onPress={() => router.push('/faq' as any)}>
          <Text style={[styles.legalLink, styles.faqLink, { color: theme.tint }]}>
            ❔ Comment ça marche (FAQ)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    padding: 10,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  messageSuccess: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
  messageTextError: {
    color: '#c62828',
  },
  messageTextSuccess: {
    color: '#2e7d32',
  },
  legalContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    fontWeight: 'bold',
  },
  faqLink: {
    marginTop: 15,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
