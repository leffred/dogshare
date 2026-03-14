import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Platform, TextInput, Animated } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { PlatformDatePicker } from '@/components/ui/PlatformDatePicker';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Premium shadow for cards across platforms
const premiumShadow = Platform.OS === 'ios' ? {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
} : {
  elevation: 5,
};

export default function CreateSittingScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [dogs, setDogs] = useState<any[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  
  // Date states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 3600000)); // Default to +1 hour
  
  // Credits state
  const [creditsCost, setCreditsCost] = useState('1');
  const [isManualCredits, setIsManualCredits] = useState(false);

  useEffect(() => {
    async function fetchDogs() {
      if (!user) return;
      const { data } = await supabase.from('dogs').select('*').eq('owner_id', user.id);
      if (data && data.length > 0) {
        setDogs(data);
        setSelectedDogId(data[0].id);
      }
    }
    fetchDogs();
  }, [user]);

  // Auto-calculate credits based on time duration (1 credit = 1 hour)
  // And auto-adjust end date if start date is moved past it
  useEffect(() => {
    if (startDate && endDate) {
      if (startDate >= endDate) {
        // Automatically set end date to start date + 1 minute
        setEndDate(new Date(startDate.getTime() + 60000));
        return; // the next render will handle credit calculation
      }
      
      if (!isManualCredits) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); // Round up to nearest hour
        if (diffHours > 0) {
          setCreditsCost(diffHours.toString());
        }
      }
    }
  }, [startDate, endDate, isManualCredits]);

  const handleCreditsChange = (val: string) => {
    setIsManualCredits(true);
    setCreditsCost(val);
  };

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

  async function submitRequest() {
    if (!user) return;
    if (!selectedDogId) {
      Alert.alert('Erreur', 'Vous devez sélectionner un chien.');
      return;
    }
    
    const cost = parseInt(creditsCost, 10);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert('Erreur', 'La récompense doit être d\'au moins 1 crédit.');
      return;
    }
    
    if (!profile || profile.credits < cost) {
      Alert.alert('Erreur', "Vous n'avez pas assez de crédits pour cette garde.");
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Erreur', 'La date de fin de garde doit être ultérieure à la date de début.');
      return;
    }

    setLoading(true);

    try {
      const newSitting = {
        requester_id: user.id,
        dog_id: selectedDogId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'pending',
        credits_cost: cost,
      };

      const { error } = await supabase.from('sittings').insert([newSitting]);

      if (error) throw error;

      if(Platform.OS !== 'web') Alert.alert('Succès', 'Votre demande de garde a été publiée sur le mur !');
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la demande de garde.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <Text style={[{ color: theme.tint, fontSize: 16 }]}>Retour</Text>
         </TouchableOpacity>
         <Text style={[styles.title, { color: theme.text }]}>Demander une garde</Text>
      </View>

      {dogs.length === 0 ? (
        <View style={styles.noDogs}>
           <Text style={{color: theme.icon, textAlign: 'center'}}>Vous devez d'abord ajouter un chien dans l'onglet "Mes Chiens" avant de pouvoir demander une garde.</Text>
        </View>
      ) : (
        <>
          <View style={styles.cardContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Pour quel chien ?</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10}}>
                {dogs.map(dog => (
                  <AnimatedButton 
                    key={dog.id}
                    style={[
                      styles.dogSelector, 
                      { borderColor: theme.tint },
                      selectedDogId === dog.id ? { backgroundColor: theme.tint } : { backgroundColor: 'transparent' }
                    ]}
                    onPress={() => setSelectedDogId(dog.id)}
                  >
                    <Text style={{ color: selectedDogId === dog.id ? '#fff' : theme.text, fontWeight: 'bold' }}>{dog.name}</Text>
                  </AnimatedButton>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Date de début</Text>
              <PlatformDatePicker value={startDate} onChange={setStartDate} theme={theme} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Date de fin</Text>
              <PlatformDatePicker value={endDate} onChange={setEndDate} theme={theme} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Récompense proposée</Text>
              <Text style={{fontSize: 12, color: theme.icon, marginBottom: 8}}>Calculé : 1 crédit = 1 heure de garde</Text>
              <View style={styles.creditsInputWrapper}>
                <IconSymbol name="star.fill" size={20} color={theme.accent} style={styles.creditsIcon} />
                <TextInput
                  style={[styles.input, styles.creditsInput, { color: theme.text, borderColor: theme.border }]}
                  onChangeText={handleCreditsChange}
                  value={creditsCost}
                  keyboardType="numeric"
                />
                <Text style={[styles.creditsSuffix, { color: theme.text }]}>Crédits</Text>
              </View>
              <Text style={{fontSize: 12, color: theme.icon, marginTop: 4, textAlign: 'right'}}>Votre Solde : <Text style={{fontWeight: 'bold', color: theme.accent}}>{profile?.credits || 0}</Text></Text>
            </View>
          </View>

          <View style={[styles.verticallySpaced, styles.mt20]}>
            <AnimatedButton
              style={[styles.button, { backgroundColor: theme.tint }]}
              onPress={submitRequest}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Publication...' : 'Publier la demande'}
              </Text>
            </AnimatedButton>
          </View>
        </>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
    justifyContent: 'center'
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 10,
    marginLeft: -10,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 25,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...premiumShadow,
  },
  dogSelector: {
    borderWidth: 2, // Thicker border for better visibility
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20, // Pill styling
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.02)', // slight inner shadow effect
  },
  creditsInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  creditsIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  creditsInput: {
    flex: 1,
    paddingLeft: 45, // Make room for the star icon
    fontSize: 18,
    fontWeight: 'bold',
  },
  creditsSuffix: {
    position: 'absolute',
    right: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  button: {
    height: 56, // Taller button
    borderRadius: 28, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    ...premiumShadow, // Drop shadow to make it pop
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDogs: {
    marginTop: 50,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
  }
});
