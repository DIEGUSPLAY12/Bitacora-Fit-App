import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useWorkouts() {
  const { user } = useAuth();
  const PAGE_SIZE = 10;

  return useInfiniteQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user) throw new Error('No auth');

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            exercises ( muscle_group ),
            sets ( weight_kg, reps )
          )
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    enabled: !!user,
  });
}

export function useWorkoutDetail(id: string) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            id,
            order_index,
            exercises ( id, name, category, muscle_group, image_url, gif_url ),
            sets ( id, set_number, weight_kg, reps )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Ordenar por índices
      if (data && data.workout_exercises) {
        data.workout_exercises.sort((a: any, b: any) => a.order_index - b.order_index);
        data.workout_exercises.forEach((we: any) => {
          we.sets.sort((a: any, b: any) => a.set_number - b.set_number);
        });
      }

      return data;
    },
    enabled: !!id,
  });
}
