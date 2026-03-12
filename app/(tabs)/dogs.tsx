import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Image, Platform, Animated } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export type Dog = {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  age: number | null;
  weight: number | null;
  character: string | null;
  photo_url: string | null;
};

// Premium shadow for cards across platforms
const premiumShadow = Platform.OS === 'ios' ? {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
} : {
  elevation: 5,
};

export default function DogsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDogs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Error fetching dogs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDogs();
  };

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const AnimatedCard = ({ onPress, style, children }: { onPress: () => void, style: any, children: React.ReactNode }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.98,
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
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[style, { transform: [{ scale: scaleValue }] }]}
      >
        {children}
      </AnimatedTouchableOpacity>
    );
  };

  const AnimatedButton = ({ onPress, style, children }: { onPress: () => void, style: any, children: React.ReactNode }) => {
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
        style={[style, { transform: [{ scale: scaleValue }] }]}
      >
        {children}
      </AnimatedTouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Mes Chiens</Text>
        <AnimatedButton 
          style={[styles.addButton, { backgroundColor: theme.tint }]}
          onPress={() => router.push('/dogs/add' as any)}
        >
          <IconSymbol name="plus" size={24} color="#fff" />
        </AnimatedButton>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing ? (
          <Text style={[styles.emptyText, { color: theme.text }]}>Chargement de vos chiens...</Text>
        ) : dogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>Vous n'avez pas encore ajouté de chien.</Text>
            <TouchableOpacity onPress={() => router.push('/dogs/add' as any)}>
              <Text style={[styles.linkText, { color: theme.tint }]}>Ajouter mon premier chien</Text>
            </TouchableOpacity>
          </View>
        ) : (
          dogs.map((dog) => (
            <AnimatedCard 
              key={dog.id} 
              style={[styles.dogCard, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#fff' }]}
              onPress={() => router.push(`/dogs/${dog.id}` as any)}
            >
              <View style={styles.dogAvatarPlaceholder}>
                {dog.photo_url ? (
                  <Image source={{ uri: dog.photo_url }} style={{ width: 70, height: 70, borderRadius: 35 }} />
                ) : (
                  <IconSymbol name="pawprint.fill" size={40} color={theme.icon} />
                )}
              </View>
              <View style={styles.dogInfo}>
                <Text style={[styles.dogName, { color: theme.text }]}>{dog.name}</Text>
                <Text style={[styles.dogDetails, { color: theme.icon }]}>
                  {dog.breed ? `${dog.breed} ` : ''} 
                  {dog.age ? `• ${dog.age} an(s) ` : ''}
                  {dog.weight ? `• ${dog.weight}kg` : ''}
                </Text>
              </View>
              <View style={[styles.chevronContainer, { backgroundColor: theme.background }]}>
                <IconSymbol name="chevron.right" size={20} color={theme.icon} />
              </View>
            </AnimatedCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...premiumShadow,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.7,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20, // Rounded cards instead of 12
    borderWidth: 0, // No border
    marginBottom: 20,
    ...premiumShadow,
  },
  dogAvatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: 20, // Slightly bigger text
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dogDetails: {
    fontSize: 14,
  },
  chevronContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
