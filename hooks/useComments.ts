import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useWorkoutComments(workoutId: string) {
  return useQuery({
    queryKey: ['comments', workoutId],
    enabled: !!workoutId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_comments')
        .select(`
          id, content, created_at,
          profiles(id, username, avatar_url)
        `)
        .eq('workout_id', workoutId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data;
    }
  });
}

export function usePostComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ workoutId, content }: { workoutId: string, content: string }) => {
      const { data, error } = await supabase
        .from('workout_comments')
        .insert({
          workout_id: workoutId,
          user_id: user!.id,
          content
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.workoutId] });
      // We should probably also invalidate the feed to update comment counts if we had them
    }
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      const { error } = await supabase
        .from('workout_comments')
        .delete()
        .eq('id', commentId);
        
      if (error) throw error;
      return commentId;
    },
    onSuccess: (_, variables) => {
      // Invalidate all comments just to be safe, or we could pass workoutId to invalidate specifically
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    }
  });
}
