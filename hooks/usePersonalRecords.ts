import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function usePersonalRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personalRecords', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          workout_exercises (
            exercises (
              id, name, muscle_group, image_url
            ),
            sets (
              weight_kg, reps
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const recordsMap = new Map<string, { exercise: any, maxWeight: number, maxRepsAtWeight: number }>();

      data?.forEach((workout: any) => {
        workout.workout_exercises?.forEach((we: any) => {
          if (!we.exercises || !we.sets) return;
          
          const ex = we.exercises;
          let maxForThisSession = 0;
          let repsForMax = 0;

          we.sets.forEach((set: any) => {
            const w = Number(set.weight_kg);
            const r = Number(set.reps);
            if (w > maxForThisSession) {
              maxForThisSession = w;
              repsForMax = r;
            } else if (w === maxForThisSession && r > repsForMax) {
              repsForMax = r;
            }
          });

          if (maxForThisSession > 0) {
            const existing = recordsMap.get(ex.id);
            if (!existing || maxForThisSession > existing.maxWeight || (maxForThisSession === existing.maxWeight && repsForMax > existing.maxRepsAtWeight)) {
              recordsMap.set(ex.id, {
                exercise: ex,
                maxWeight: maxForThisSession,
                maxRepsAtWeight: repsForMax
              });
            }
          }
        });
      });

      return Array.from(recordsMap.values()).sort((a, b) => b.maxWeight - a.maxWeight);
    },
    enabled: !!user,
  });
}
