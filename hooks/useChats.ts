import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useChats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['chats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get all chats the user is in
      const { data: memberChats, error: memberError } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', user!.id);
        
      if (memberError) throw memberError;
      if (!memberChats || memberChats.length === 0) return [];
      
      const chatIds = memberChats.map(m => m.chat_id);
      
      // Get chat details, members and last message
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id, type, name, created_at,
          chat_members(user_id, last_read_at, profiles(username, avatar_url, last_seen_at)),
          chat_messages(id, user_id, content, created_at, shared_workout_id)
        `)
        .in('id', chatIds)
        .order('created_at', { ascending: false });
        
      if (chatsError) throw chatsError;
      
      // Format the data
      return chats.map((chat: any) => {
        // Sort messages manually since we can't easily order nested relations with limit 1 in standard select
        const messages = chat.chat_messages || [];
        messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const lastMessage = messages[0];
        
        // Calculate unread count
        const myMemberRecord = chat.chat_members?.find((m: any) => m.user_id === user!.id);
        const myLastReadAt = myMemberRecord?.last_read_at ? new Date(myMemberRecord.last_read_at).getTime() : 0;
        
        const unreadCount = messages.filter((m: any) => 
          m.user_id !== user!.id && new Date(m.created_at).getTime() > myLastReadAt
        ).length;
        
        return {
          ...chat,
          lastMessage,
          unreadCount
        };
      }).sort((a: any, b: any) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime();
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
      });
    }
  });
}

export function useChatMessages(chatId: string) {
  return useQuery({
    queryKey: ['chat_messages', chatId],
    enabled: !!chatId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id, content, created_at, shared_workout_id, user_id,
          profiles(id, username, avatar_url),
          workouts(id, name, is_template, workout_exercises(id))
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data;
    }
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ chatId, content, sharedWorkoutId }: { chatId: string, content?: string, sharedWorkoutId?: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: user!.id,
          content: content || null,
          shared_workout_id: sharedWorkoutId || null
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ type, name, memberIds }: { type: 'direct' | 'group', name?: string, memberIds: string[] }) => {
      // If direct, check if chat already exists
      if (type === 'direct' && memberIds.length === 1) {
        const friendId = memberIds[0];
        // Find chats where both are members and chat is direct
        const { data: existingChats, error: fetchError } = await supabase
          .from('chats')
          .select('id, type, chat_members!inner(user_id)')
          .eq('type', 'direct');
          
        if (fetchError) throw fetchError;
        
        // Find a chat that has exactly both users
        const existingChat = existingChats.find((c: any) => {
          const memberUids = c.chat_members.map((m: any) => m.user_id);
          return memberUids.includes(user!.id) && memberUids.includes(friendId) && memberUids.length === 2;
        });
        
        if (existingChat) {
          return existingChat.id;
        }
      }
      
      // Create new chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({ type, name: name || null })
        .select()
        .single();
        
      if (chatError) throw chatError;
      
      // Add members
      const membersToInsert = [user!.id, ...memberIds].map(id => ({
        chat_id: chat.id,
        user_id: id
      }));
      
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(membersToInsert);
        
      if (membersError) throw membersError;
      
      return chat.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
}

export function useMarkChatRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', user!.id);
        
      if (error) throw error;
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    }
  });
}
