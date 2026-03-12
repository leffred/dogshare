import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user1_id,
          user2_id,
          updated_at,
          user1:user1_id (id, full_name, avatar_url),
          user2:user2_id (id, full_name, avatar_url),
          messages (
            content,
            created_at,
            sender_id,
            read
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Clean up data to easily access 'other_user' and 'last_message'
      const formattedData = data?.map(conv => {
        const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;
        // Supabase returns related messages (unlimited here, we should limit to 1 in a real prod app but PostgREST syntax for nested limits is tricky)
        // We sort in-memory to get the latest message
        const sortedMsgs = (conv.messages as any[]).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastMessage = sortedMsgs.length > 0 ? sortedMsgs[0] : null;
        
        let unreadCount = 0;
        if(sortedMsgs.length > 0) {
           unreadCount = sortedMsgs.filter(m => !m.read && m.sender_id !== user.id).length;
        }

        return {
          id: conv.id,
          otherUser,
          lastMessage,
          unreadCount,
          updated_at: conv.updated_at
        };
      });

      // Filter out conversations with 0 messages to keep inbox clean
      const activeConvs = formattedData?.filter(c => c.lastMessage !== null) || [];
      
      // Sort by last message date
      activeConvs.sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      setConversations(activeConvs);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to changes in conversations to update inbox
    if(user) {
        const channel = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                () => { fetchConversations(); }
            )
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [user]);

  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.conversationItem, { borderBottomColor: theme.icon + '20' }]}
      onPress={() => router.push({
         pathname: '/chat/[id]',
         params: { id: item.id, otherUserName: item.otherUser?.full_name, otherUserId: item.otherUser?.id }
      } as any)}
    >
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.icon + '20' }]}>
        <IconSymbol name="person.fill" size={24} color={theme.icon} />
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {item.otherUser?.full_name || 'Utilisateur inconnu'}
          </Text>
          <Text style={[styles.dateText, { color: theme.icon }]}>
            {formatDate(item.updated_at)}
          </Text>
        </View>
        
        <View style={styles.messageFooter}>
          <Text 
            style={[
              styles.lastMessage, 
              { color: item.unreadCount > 0 ? theme.text : theme.icon },
              item.unreadCount > 0 && { fontWeight: 'bold' }
            ]} 
            numberOfLines={1}
          >
            {item.lastMessage?.sender_id === user?.id ? 'Vous: ' : ''}
            {item.lastMessage?.content}
          </Text>
          
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.tint }]}>
              <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="message" size={50} color={theme.icon} />
              <Text style={[styles.emptyText, { color: theme.icon }]}>
                Vous n'avez pas encore de messages. Explorez les gardes pour lancer une discussion !
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
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 24,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  dateText: {
    fontSize: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  }
});
