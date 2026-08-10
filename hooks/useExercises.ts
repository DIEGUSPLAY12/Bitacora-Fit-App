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
        const dbCategory = getDbMuscleGroup(categoryFilter);
        if (dbCategory) {
          if (Array.isArray(dbCategory)) {
            query = query.in('muscle_group', dbCategory);
          } else {
            query = query.eq('muscle_group', dbCategory);
          }
        }
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

function getDbMuscleGroup(uiFilter: string) {
  switch (uiFilter) {
    case 'Pecho': return 'pectorals';
    case 'Espalda': return ['lats', 'upper back', 'lower back', 'traps', 'rhomboids'];
    case 'Piernas': return ['quadriceps', 'quads', 'hamstrings', 'glutes', 'calves'];
    case 'Hombro': return 'delts';
    case 'Brazo': return ['biceps', 'triceps', 'forearms'];
    case 'Core': return ['abs', 'obliques'];
    default: return null;
  }
}
