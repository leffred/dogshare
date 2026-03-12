import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity, Switch, ScrollView, FlatList, Keyboard, Animated, Platform } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Premium shadow
  const premiumShadow = Platform.OS === 'ios' ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  } : {
    elevation: 5,
  };

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success'} | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [hasGarden, setHasGarden] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [acceptsOtherDogs, setAcceptsOtherDogs] = useState(false);

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAddress(profile.address || '');
      setLat(profile.lat || null);
      setLng(profile.lng || null);
      setHasGarden(profile.has_garden || false);
      setHasChildren(profile.has_children || false);
      setAcceptsOtherDogs(profile.accepts_other_dogs || false);
    }
  }, [profile]);

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const AnimatedButton = ({ onPress, style, children, disabled }: { onPress: () => void, style: any, children: React.ReactNode, disabled?: boolean }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <AnimatedTouchableOpacity
        activeOpacity={0.8}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[style, { transform: [{ scale: scaleValue }], opacity: disabled ? 0.6 : 1 }]}
        disabled={disabled}
      >
        {children}
      </AnimatedTouchableOpacity>
    );
  };

  const searchAddress = async (text: string) => {
    setAddress(text);
    if (text.length > 2) {
      try {
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=5`);
        const json = await response.json();
        setSuggestions(json.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Erreur lors de la recherche d'adresse", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectAddress = (item: any) => {
    setAddress(item.properties.label);
    if (item.geometry && item.geometry.coordinates) {
      setLng(item.geometry.coordinates[0]);
      setLat(item.geometry.coordinates[1]);
    }
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  async function updateProfile() {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    const updates = {
      id: user.id,
      full_name: fullName,
      address,
      lat,
      lng,
      has_garden: hasGarden,
      has_children: hasChildren,
      accepts_other_dogs: acceptsOtherDogs,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else {
      setMessage({ text: 'Profil mis à jour avec succès !', type: 'success' });
      await refreshProfile(); // Refresh global profile state
    }
    
    setLoading(false);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: theme.text }]}>Mon Profil</Text>

      {message && (
        <View style={[styles.messageBox, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
          <Text style={[styles.messageText, message.type === 'error' ? styles.messageTextError : styles.messageTextSuccess]}>
            {message.text}
          </Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.text }]}>Nom complet</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
          onChangeText={setFullName}
          value={fullName}
          placeholder="Jean Dupont"
          placeholderTextColor={theme.icon}
        />
      </View>

      <View style={[styles.inputContainer, { zIndex: 10 }]}>
        <Text style={[styles.label, { color: theme.text }]}>Adresse postale</Text>
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.icon }]}
          onChangeText={searchAddress}
          value={address}
          placeholder="Ex: 10 Rue de la Paix, Paris"
          placeholderTextColor={theme.icon}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: theme.background, borderColor: theme.icon }]}>
            {suggestions.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.suggestionItem, index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#eee' }]}
                onPress={() => selectAddress(item)}
              >
                <Text style={{ color: theme.text }}>{item.properties.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.switchContainer}>
        <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>J'ai un jardin</Text>
        <Switch value={hasGarden} onValueChange={setHasGarden} trackColor={{ true: theme.tint }} />
      </View>

      <View style={styles.switchContainer}>
        <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>J'ai des enfants</Text>
        <Switch value={hasChildren} onValueChange={setHasChildren} trackColor={{ true: theme.tint }} />
      </View>

      <View style={styles.switchContainer}>
        <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>J'accepte d'autres chiens en garde</Text>
        <Switch value={acceptsOtherDogs} onValueChange={setAcceptsOtherDogs} trackColor={{ true: theme.tint }} />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <AnimatedButton
          style={[styles.button, { backgroundColor: theme.tint, ...premiumShadow }]}
          onPress={updateProfile}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Enregistrement...' : 'Sauvegarder mon profil'}
          </Text>
        </AnimatedButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 20,
    zIndex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 75, // just below the input field
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 1,
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
    borderRadius: 12, // Pill design
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  button: {
    height: 56, // Taller
    borderRadius: 28, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    zIndex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  }
});
