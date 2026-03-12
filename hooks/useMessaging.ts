import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

export const useMessaging = () => {
  const { user } = useAuth();
  const router = useRouter();

  const startConversation = async (otherUserId: string, otherUserName: string) => {
    if (!user || user.id === otherUserId) return;

    try {
      // 1. Check if conversation already exists
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`);

      if (fetchError) throw fetchError;

      if (existingConvs && existingConvs.length > 0) {
        // Conversation exists, navigate to it
        router.push({
          pathname: '/chat/[id]',
          params: { id: existingConvs[0].id, otherUserName, otherUserId }
        } as any);
        return;
      }

      // 2. Create new conversation
      // user1_id must be < user2_id as per our SQL constraint
      const isUser1 = user.id < otherUserId;
      const { data: newConv, error: insertError } = await supabase
        .from('conversations')
        .insert({
          user1_id: isUser1 ? user.id : otherUserId,
          user2_id: isUser1 ? otherUserId : user.id
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Navigate to new conversation
      if (newConv) {
         router.push({
             pathname: '/chat/[id]',
             params: { id: newConv.id, otherUserName, otherUserId }
         } as any);
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Impossible de démarrer la conversation');
    }
  };

  return { startConversation };
};
