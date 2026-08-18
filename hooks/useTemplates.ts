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

export function useCloneToTemplates() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (originalWorkout: any) => {
      if (!user) throw new Error('Usuario no autenticado');

      // 1. Insert the cloned workout
      const { data: newWorkout, error: wError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: originalWorkout.name,
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          is_template: true
        })
        .select()
        .single();

      if (wError) throw wError;

      // 2. Insert exercises and sets
      if (originalWorkout.workout_exercises) {
        for (const we of originalWorkout.workout_exercises) {
          const { data: newWe, error: weError } = await supabase
            .from('workout_exercises')
            .insert({
              workout_id: newWorkout.id,
              exercise_id: we.exercise_id || we.exercises?.id,
              order_index: we.order_index
            })
            .select()
            .single();
            
          if (weError) throw weError;

          if (we.sets && we.sets.length > 0) {
            const setsToInsert = we.sets.map((s: any) => ({
              workout_exercise_id: newWe.id,
              weight_kg: s.weight_kg,
              reps: s.reps,
              set_number: s.set_number
            }));
            
            const { error: sError } = await supabase.from('sets').insert(setsToInsert);
            if (sError) throw sError;
          }
        }
      }

      return newWorkout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
    }
  });
}
