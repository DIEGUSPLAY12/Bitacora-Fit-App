import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useBodyWeightLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bodyWeightLogs', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true }); // Ascending for charts

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAddBodyWeight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weight_kg: number) => {
      if (!user) throw new Error('No auth');

      // Check if we already logged today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existing } = await supabase
        .from('body_weight_logs')
        .select('id, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', today.toISOString())
        .limit(1);

      if (existing && existing.length > 0) {
        // Update today's entry
        const { error } = await supabase
          .from('body_weight_logs')
          .update({ weight_kg, logged_at: new Date().toISOString() })
          .eq('id', existing[0].id);
        if (error) throw error;
      } else {
        // Insert new entry
        const { error } = await supabase
          .from('body_weight_logs')
          .insert({ user_id: user.id, weight_kg });
        if (error) throw error;
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyWeightLogs'] });
    }
  });
}

export function useDeleteBodyWeight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('body_weight_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodyWeightLogs'] });
    }
  });
}
