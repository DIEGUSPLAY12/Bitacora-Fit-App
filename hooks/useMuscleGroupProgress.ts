import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Timeframe } from './useExerciseProgress';

export function useMuscleGroupProgress(timeframe: Timeframe) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['muscleGroupProgress', timeframe, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Determinar el límite de fecha
      const now = new Date();
      let limitDate = new Date(0); // Para 'Todo'

      if (timeframe === 'Semana') {
        limitDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'Mes') {
        limitDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (timeframe === 'Año') {
        limitDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }

      // 2. Fetch de workouts con relaciones
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          started_at,
          workout_exercises (
            exercises (
              category
            ),
            sets (
              weight_kg,
              reps,
              completed
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('started_at', limitDate.toISOString());

      if (error) throw error;

      // 3. Agregar volumen por grupo muscular
      const volumeMap: Record<string, number> = {
        Pecho: 0,
        Espalda: 0,
        Piernas: 0,
        Hombro: 0,
        Brazo: 0,
        Core: 0
      };

      data.forEach((workout: any) => {
        workout.workout_exercises?.forEach((we: any) => {
          const category = we.exercises?.category;
          if (!category) return;
          
          let weVolume = 0;
          we.sets?.forEach((set: any) => {
            if (set.completed && set.weight_kg && set.reps) {
              weVolume += (Number(set.weight_kg) * Number(set.reps));
            }
          });

          // Mapear categorías si vienen de alguna otra forma o sumarlas directamente
          // Aseguramos que la categoría exista en nuestro mapa base
          if (volumeMap[category] !== undefined) {
            volumeMap[category] += weVolume;
          } else {
             // Si hubiera categorías inesperadas, podríamos agregarlas
             volumeMap[category] = weVolume;
          }
        });
      });

      return volumeMap;
    },
    enabled: !!user,
  });
}
