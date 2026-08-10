import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { WorkoutExercise } from '../store/workout-store';

export function useSaveWorkout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      startedAt,
      finishedAt,
      exercises
    }: {
      name: string;
      startedAt: number;
      finishedAt: number;
      exercises: WorkoutExercise[];
    }) => {
      if (!user) throw new Error('Usuario no autenticado');

      // Solo guardamos los ejercicios que tienen al menos una serie completada
      const validExercises = exercises.map(ex => ({
        ...ex,
        sets: ex.sets.filter(s => s.completed)
      })).filter(ex => ex.sets.length > 0);

      if (validExercises.length === 0) {
        throw new Error('No hay series completadas para guardar');
      }

      // 1. Insert Workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name,
          started_at: new Date(startedAt).toISOString(),
          finished_at: new Date(finishedAt).toISOString(),
        })
        .select('id')
        .single();

      if (workoutError) throw workoutError;
      const workoutId = workoutData.id;

      // 2. Insert Workout Exercises & Sets
      for (let i = 0; i < validExercises.length; i++) {
        const ex = validExercises[i];
        
        const { data: weData, error: weError } = await supabase
          .from('workout_exercises')
          .insert({
            workout_id: workoutId,
            exercise_id: ex.exercise.id,
            order_index: i
          })
          .select('id')
          .single();

        if (weError) throw weError;
        const weId = weData.id;

        // Insert Sets
        const setsToInsert = ex.sets.map((set, index) => ({
          workout_exercise_id: weId,
          set_number: index + 1,
          weight_kg: set.weight,
          reps: set.reps,
        }));

        if (setsToInsert.length > 0) {
          const { error: setsError } = await supabase
            .from('sets')
            .insert(setsToInsert);

          if (setsError) throw setsError;
        }
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    }
  });
}
