import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useTemplates() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          workout_exercises (
            exercises ( name, target, category, muscle_group )
          )
        `)
        .eq('user_id', user.id)
        .eq('is_template', true)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useToggleTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, is_template }: { id: string, is_template: boolean }) => {
      const { error } = await supabase
        .from('workouts')
        .update({ is_template })
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['workout'] });
    }
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
    },
  });
}
