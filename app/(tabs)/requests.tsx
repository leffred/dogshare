import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

// A simple segmented control for the two sub-views
const Tabs = ['Mes Demandes', 'Mes Gardes'];

export default function RequestsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState(0); // 0 = Mes Demandes, 1 = Mes Gardes
  const [sittings, setSittings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSittings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const filterColumn = activeTab === 0 ? 'requester_id' : 'sitter_id';
      
      const { data, error } = await supabase
        .from('sittings')
        .select(`
          id,
          requester_id,
          sitter_id,
          start_time,
          end_time,
          status,
          credits_cost,
          dogs:dog_id (name, breed, photo_url),
          requester:requester_id (full_name),
          sitter:sitter_id (full_name)
        `)
        .eq(filterColumn, user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setSittings(data || []);
    } catch (error) {
      console.error('Error fetching sittings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSittings();
  }, [user, activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSittings();
  }, [user, activeTab]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const completeSitting = async (sittingId: string, creditsCost: number, sitterId: string | null, sitterName: string) => {
    if(!sitterId) return;
    
    Alert.alert(
      "Clôturer la garde",
      `Confirmez-vous que la garde s'est bien passée ? ${creditsCost} crédit(s) seront reversé(s) au gardien.`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          style: "default",
          onPress: async () => {
            try {
              // 1. Update sitting status
              await supabase.from('sittings').update({ status: 'completed' }).eq('id', sittingId);
              
              // 2. Transfer credits (in a real app, use a secure RPC call)
              // We'll decrement requester and increment sitter via RPC later, 
              // for now we'll do a basic status update.
              // We simulate the transaction via two update calls for now as a placeholder.
              
              // Fetch sitter profile
              const { data: sitterData } = await supabase.from('profiles').select('credits').eq('id', sitterId).single();
              // Fetch requester profile
              const { data: reqData } = await supabase.from('profiles').select('credits').eq('id', user?.id).single();
              
              if(sitterData && reqData) {
                await supabase.from('profiles').update({ credits: reqData.credits - creditsCost }).eq('id', user?.id);
                await supabase.from('profiles').update({ credits: sitterData.credits + creditsCost }).eq('id', sitterId);
                
                // create transaction record
                await supabase.from('credits_transactions').insert({
                  sitting_id: sittingId,
                  from_user_id: user?.id,
                  to_user_id: sitterId,
                  amount: creditsCost
                });
              }

              Alert.alert(
                "Terminé", 
                "Les crédits ont été transférés !",
                [{ text: "OK", onPress: () => {
                   router.push({
                     pathname: '/reviews/create',
                     params: { sittingId, revieweeId: sitterId, revieweeName: sitterName }
                   } as any);
                }}]
              );
              fetchSittings();
            } catch (err) {
              console.error(err);
              Alert.alert("Erreur", "Une erreur est survenue.");
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    let color = theme.icon;
    let label = status;
    let bgColor = 'rgba(0,0,0,0.1)';

    if (status === 'pending') {
      color = '#f39c12';
      bgColor = 'rgba(243, 156, 18, 0.15)';
      label = 'En attente';
    } else if (status === 'accepted') {
      color = '#3498db';
      bgColor = 'rgba(52, 152, 219, 0.15)';
      label = 'Acceptée';
    } else if (status === 'completed') {
      color = '#2ecc71';
      bgColor = 'rgba(46, 204, 113, 0.15)';
      label = 'Terminée';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={{ color, fontSize: 12, fontWeight: 'bold' }}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#fff', borderColor: theme.icon + '30' }]}>
      <View style={styles.cardHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
           {item.dogs?.photo_url ? (
             <Image source={{ uri: item.dogs.photo_url }} style={styles.dogPhoto} />
           ) : (
             <View style={[styles.placeholderPhoto, { backgroundColor: theme.icon + '20' }]}>
               <IconSymbol name="pawprint.fill" size={24} color={theme.icon} />
             </View>
           )}
           <Text style={[styles.dogName, { color: theme.text }]}>{item.dogs?.name || 'Chien inconnu'}</Text>
        </View>
        {getStatusBadge(item.status)}
      </View>
      
      <View style={[styles.cardBody, { borderTopColor: theme.icon + '20' }]}>
        <Text style={[styles.dateText, { color: theme.text }]}>
          Du {formatDate(item.start_time)}{'\n'}Au {formatDate(item.end_time)}
        </Text>
        
        {activeTab === 0 ? (
          // Mes Demandes
          <Text style={[styles.participantText, { color: theme.icon }]}>
            Gardien : {item.sitter ? item.sitter.full_name : <Text style={{fontStyle: 'italic'}}>En attente d'un volontaire</Text>}
          </Text>
        ) : (
          // Mes Gardes
          <Text style={[styles.participantText, { color: theme.icon }]}>
            Propriétaire : {item.requester?.full_name}
          </Text>
        )}
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.icon + '20' }]}>
        <Text style={[styles.creditsText, { color: activeTab === 0 ? '#e74c3c' : '#2ecc71' }]}>
          {activeTab === 0 ? '-' : '+'}{item.credits_cost} Crédit(s)
        </Text>
        
        {/* Actions section */}
        {activeTab === 0 && item.status === 'accepted' && (
          <TouchableOpacity 
             style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
             onPress={() => completeSitting(item.id, item.credits_cost, item.sitter_id, item.sitter?.full_name)}
          >
             <Text style={styles.actionText}>Clôturer la garde</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Suivi</Text>
      </View>

      <View style={styles.tabsContainer}>
        {Tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tab,
              activeTab === index ? { borderBottomColor: theme.tint, backgroundColor: theme.tint + '10' } : { borderBottomColor: 'transparent' }
            ]}
            onPress={() => setActiveTab(index)}
          >
            <Text style={[styles.tabText, { color: activeTab === index ? theme.tint : theme.icon, fontWeight: activeTab === index ? 'bold' : 'normal' }]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sittings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                {activeTab === 0 ? "Vous n'avez aucune demande de garde en cours." : "Vous n'avez proposé aucune garde pour le moment."}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 16,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  dogPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  placeholderPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dogName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cardBody: {
    padding: 15,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 22,
  },
  participantText: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
  },
  creditsText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
