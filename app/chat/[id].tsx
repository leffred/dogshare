import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChatScreen() {
  const { id, otherUserName, otherUserId } = useLocalSearchParams();
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Mark as read
      const unreadIds = data?.filter(m => !m.read && m.sender_id !== user.id).map(m => m.id);
      if(unreadIds && unreadIds.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unreadIds);
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (user && id) {
      const channel = supabase.channel(`chat_${id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
          (payload) => {
            setMessages((prev) => {
                // Check duplicate before adding (React strict mode glitch prevention)
                if(prev.find(m => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            
            // Mark as read if we received it
            if(payload.new.sender_id !== user.id) {
               supabase.from('messages').update({ read: true }).eq('id', payload.new.id).then();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, id]);

  const sendMessage = async () => {
    if (!user || !id || !inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: id,
          sender_id: user.id,
          content: content,
        }
      ]);

      if (error) throw error;
      
      // Trigger push notification
      if (otherUserId) {
        supabase.functions.invoke('send-notification', {
          body: {
            userId: otherUserId,
            title: `Nouveau message de ${profile?.full_name || "quelqu'un"}`,
            body: content,
            data: { url: `/chat/${id}` }
          }
        }).catch(err => console.error("Error sending push:", err));
      }
      
      // Realtime subscription will add it to the list automatically
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(content); // Restore text on failure
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[
        styles.messageContainer, 
        isMine ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble, 
          isMine ? [styles.myMessageBubble, { backgroundColor: theme.tint }] : [styles.theirMessageBubble, { backgroundColor: theme.icon + '20' }]
        ]}>
          <Text style={[styles.messageText, { color: isMine ? '#fff' : theme.text }]}>
            {item.content}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: theme.icon, alignSelf: isMine ? 'flex-end' : 'flex-start' }]}>
          {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { borderBottomColor: theme.icon + '20' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={theme.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {otherUserName || 'Discussion'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onLayout={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100)}
        />
      )}

      <View style={[styles.inputContainer, { borderTopColor: theme.icon + '20', backgroundColor: theme.background }]}>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.icon + '15' }]}
          placeholder="Votre message..."
          placeholderTextColor={theme.icon}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: theme.tint, opacity: inputText.trim() ? 1 : 0.5 }]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isSending}
        >
          <IconSymbol name="paperplane.fill" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2, // align with input
  }
});
