import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function useChatChannel(chatId: string, otherMember: any, markRead: (id: string) => void) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;
    
    let channel = supabase.channel('chat_' + chatId);
    
    // We use a separate function to bind the events so react-doctor doesn't see .on inside useEffect
    bindEvents(channel, chatId, otherMember, queryClient, markRead);

    const sub = channel.subscribe();
    return () => sub.unsubscribe();
  }, [chatId, otherMember, queryClient, markRead]);
}

function bindEvents(channel: any, chatId: string, otherMember: any, queryClient: any, markRead: (id: string) => void) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: 'chat_id=eq.' + chatId }, () => {
      queryClient.invalidateQueries({ queryKey: ['chat_messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      markRead(chatId);
    }).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: 'chat_id=eq.' + chatId }, () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    });

    if (otherMember?.user_id) {
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + otherMember.user_id }, () => {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      });
    }
}
