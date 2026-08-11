import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type Timeframe = '1M' | '3M' | '6M' | 'Todo';

export interface ProgressDataPoint {
  date: Date;
  maxWeight: number;
  label: string; // MM/DD
}

export function useExerciseProgress(exerciseId: string | null, timeframe: Timeframe) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exerciseProgress', exerciseId, timeframe, user?.id],
    queryFn: async () => {
      if (!user || !exerciseId) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          started_at,
          workout_exercises!inner (
            exercise_id,
            sets (
              weight_kg,
              reps,
              completed
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('workout_exercises.exercise_id', exerciseId)
        .order('started_at', { ascending: true });

      if (error) throw error;

      // Agrupar por entreno y encontrar el peso máximo
      const points: ProgressDataPoint[] = [];

      data.forEach((workout: any) => {
        const date = new Date(workout.started_at);
        
        // Juntar todos los sets de este ejercicio en este entreno
        const allSets = workout.workout_exercises.flatMap((we: any) => we.sets);
        
        if (allSets.length > 0) {
          const maxWeight = Math.max(...allSets.map((s: any) => Number(s.weight_kg) || 0));
          if (maxWeight > 0) {
            points.push({
              date,
              maxWeight,
              label: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
            });
          }
        }
      });

      // Filtrar por rango de tiempo
      const now = new Date();
      return points.filter(p => {
        const diffDays = (now.getTime() - p.date.getTime()) / (1000 * 60 * 60 * 24);
        if (timeframe === '1M') return diffDays <= 30;
        if (timeframe === '3M') return diffDays <= 90;
        if (timeframe === '6M') return diffDays <= 180;
        return true;
      });
    },
    enabled: !!user && !!exerciseId,
  });
}
