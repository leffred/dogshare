import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Image, Alert, Platform, Animated } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { PlatformMap } from '@/components/ui/PlatformMap';
import { useMessaging } from '@/hooks/useMessaging';

type SittingWithDetails = {
  id: string;
  requester_id: string;
  start_time: string;
  end_time: string;
  credits_cost: number;
  dogs?: {
    name: string;
    breed: string | null;
    photo_url: string | null;
  };
  profiles?: {
    full_name: string;
    address: string | null;
    lat?: number | null;
    lng?: number | null;
    rating_average?: number;
    rating_count?: number;
  };
  distance?: number;
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

export default function ExploreScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [sittings, setSittings] = useState<SittingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { startConversation } = useMessaging();

  const fetchSittings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch pending sittings where the requester is NOT the current user
      const { data, error } = await supabase
        .from('sittings')
        .select(`
          id,
          requester_id,
          start_time,
          end_time,
          credits_cost,
          dogs:dog_id (name, breed, photo_url),
          profiles:requester_id (full_name, address, lat, lng, rating_average, rating_count)
        `)
        .eq('status', 'pending')
        .neq('requester_id', user.id);

      if (error) throw error;
      
      let fetchedSittings = data as unknown as SittingWithDetails[] || [];
      
      // Calculate distances and sort
      if (profile?.lat && profile?.lng) {
        fetchedSittings = fetchedSittings.map(sitting => {
          if (sitting.profiles?.lat && sitting.profiles?.lng) {
            const R = 6371; // Earth's radius in km
            const dLat = (sitting.profiles.lat - profile.lat!) * Math.PI / 180;
            const dLon = (sitting.profiles.lng - profile.lng!) * Math.PI / 180;
            const a = 
              Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(profile.lat! * Math.PI / 180) * Math.cos(sitting.profiles.lat * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
            sitting.distance = R * c;
          }
          return sitting;
        });

        // Sort by distance ascending
        fetchedSittings.sort((a, b) => {
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      } else {
        // Fallback: sort by start_time if no coordinates available
        fetchedSittings.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      }
      
      setSittings(fetchedSittings);
    } catch (error) {
      console.error('Error fetching sittings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSittings();
  }, [user, profile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSittings();
  }, [user, profile]);

  const handlePropose = (sitting: SittingWithDetails) => {
    Alert.alert(
      "Se proposer",
      `Voulez-vous proposer de garder ${sitting.dogs?.name || 'ce chien'} pour ${sitting.credits_cost} crédit(s) ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: () => acceptSitting(sitting) }
      ]
    );
  };

  const acceptSitting = async (sitting: SittingWithDetails) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('sittings')
        .update({
          sitter_id: user.id,
          status: 'accepted',
          updated_at: new Date()
        })
        .eq('id', sitting.id);
        
      if (error) throw error;
      
      // Notify requester
      if (sitting.requester_id) {
        supabase.functions.invoke('send-notification', {
          body: {
            userId: sitting.requester_id,
            title: `Garde acceptée !`,
            body: `${profile?.full_name || 'Un gardien'} s'est proposé pour garder ${sitting.dogs?.name || 'votre chien'}.`,
            data: { url: `/requests` }
          }
        }).catch(err => console.error("Error sending push:", err));
      }
      
      Alert.alert("Succès", "Votre proposition a été envoyée !");
      fetchSittings(); // Refresh list to remove the accepted sitting
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
      Alert.alert("Erreur", "Impossible d'accepter cette garde.");
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

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

  const renderItem = ({ item }: { item: SittingWithDetails }) => (
    <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#fff', borderColor: theme.icon + '30' }]}>
      <View style={styles.cardHeader}>
        {item.dogs?.photo_url ? (
          <Image source={{ uri: item.dogs.photo_url }} style={styles.dogPhoto} />
        ) : (
          <View style={[styles.placeholderPhoto, { backgroundColor: theme.icon + '20' }]}>
            <IconSymbol name="pawprint.fill" size={30} color={theme.icon} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={[styles.dogName, { color: theme.text }]}>{item.dogs?.name || 'Inconnu'}</Text>
          <Text style={[styles.dogBreed, { color: theme.icon }]}>{item.dogs?.breed || 'Race non précisée'}</Text>
          <Text style={[styles.location, { color: theme.icon }]}>
            📍 {item.distance !== undefined ? `À ${item.distance.toFixed(1)} km` : (item.profiles?.address || 'Adresse non renseignée')}
          </Text>
        </View>
      </View>
      
      <View style={[styles.cardBody, { borderTopColor: theme.icon + '20', borderBottomColor: theme.icon + '20' }]}>
        <View style={styles.dateRow}>
          <IconSymbol name="calendar" size={16} color={theme.text} />
          <Text style={[styles.dateText, { color: theme.text }]}>
            Du {formatDate(item.start_time)} au {formatDate(item.end_time)}
          </Text>
        </View>
        <Text style={[styles.requesterText, { color: theme.icon }]}>
          Demandé par {item.profiles?.full_name || 'Utilisateur'}
          {item.profiles?.rating_count && item.profiles.rating_count > 0 ? (
            <Text style={{fontWeight: 'bold', color: '#FFD700'}}>  ⭐️ {item.profiles.rating_average} ({item.profiles.rating_count})</Text>
          ) : null}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.creditsBadge, { backgroundColor: theme.accent + '20' }]}>
          <IconSymbol name="star.fill" size={16} color={theme.accent} />
          <Text style={[styles.creditsText, { color: theme.accent }]}>
          {item.credits_cost} Crédit{item.credits_cost > 1 ? 's' : ''}
        </Text>
        </View>
        <View style={{flexDirection: 'row', gap: 10}}>
          <AnimatedButton 
            style={[styles.actionButton, { backgroundColor: theme.icon + '20' }]}
            onPress={() => startConversation(item.requester_id, item.profiles?.full_name || 'Utilisateur')}
          >
            <IconSymbol name="message.fill" size={20} color={theme.icon} />
          </AnimatedButton>
          <AnimatedButton 
            style={[styles.actionButton, { backgroundColor: theme.tint }]}
            onPress={() => handlePropose(item)}
          >
            <Text style={styles.actionText}>Se proposer</Text>
          </AnimatedButton>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Gardes disponibles</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: theme.tint + '20', marginRight: 10 }]}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
          >
            <IconSymbol name={viewMode === 'list' ? "map.fill" : "list.bullet"} size={16} color={theme.tint} />
            <Text style={{color: theme.tint, marginLeft: 5, fontWeight: 'bold', fontSize: 13}}>{viewMode === 'list' ? 'Carte' : 'Liste'}</Text>
          </TouchableOpacity>
          <AnimatedButton 
            style={[styles.addButton, { backgroundColor: theme.tint }]}
            onPress={() => router.push('/sittings/create' as any)}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
          </AnimatedButton>
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={{ flex: 1 }}>
          <PlatformMap 
            sittings={sittings} 
            userLat={profile?.lat} 
            userLng={profile?.lng} 
            theme={theme}
            onMarkerPress={handlePropose}
          />
        </View>
      ) : (
        <FlatList
          data={sittings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="map" size={50} color={theme.icon} />
                <Text style={[styles.emptyText, { color: theme.text }]}>
                  Aucune de garde n'est disponible autour de vous pour le moment.
                </Text>
              </View>
            ) : null
          }
        />
      )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...premiumShadow,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
    opacity: 0.7,
  },
  card: {
    borderRadius: 20, // Plus d'arrondi
    borderWidth: 0, // Suppression de la bordure forte
    marginBottom: 20,
    backgroundColor: 'white',
    ...premiumShadow, // Nouvelle ombre diffuse
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 15,
  },
  dogPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  placeholderPhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: 15,
    justifyContent: 'center',
    flex: 1,
  },
  dogName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dogBreed: {
    fontSize: 14,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    marginTop: 6,
  },
  cardBody: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.02)', // Un fond légèrement différent pour délimiter le corps
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  requesterText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  creditsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20, // Pill badge
  },
  creditsText: {
    marginLeft: 6,
    fontWeight: 'bold',
  },
  proposeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  proposeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20, // Effet Pill Button au lieu de carré classique
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
