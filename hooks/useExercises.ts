import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Exercise } from '../store/workout-store';

export function useExercises(searchQuery: string, categoryFilter: string | null) {
  return useQuery({
    queryKey: ['exercises', searchQuery, categoryFilter],
    queryFn: async () => {
      let query = supabase.from('exercises').select('*');
      
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      
      if (categoryFilter && categoryFilter !== 'Todos') {
        query = query.eq('category', categoryFilter);
      }

      query = query.limit(50); // Límite por rendimiento
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('exercises').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Exercise;
    },
  });
}

