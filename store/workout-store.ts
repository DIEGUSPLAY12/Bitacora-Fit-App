import { create } from 'zustand';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  muscle_group: string;
  secondary_muscles: string[];
  instructions_es: string;
  image_url: string;
  gif_url: string;
}

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: WorkoutSet[];
}

interface WorkoutState {
  isActive: boolean;
  startedAt: number | null;
  exercises: WorkoutExercise[];
  restTimerEndsAt: number | null;
  
  startWorkout: () => void;
  loadFromTemplate: (exercises: WorkoutExercise[]) => void;
  endWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', delta: number) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  
  startRestTimer: (seconds?: number) => void;
  clearRestTimer: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  isActive: false,
  startedAt: null,
  exercises: [],
  restTimerEndsAt: null,

  startWorkout: () => set({ isActive: true, startedAt: Date.now(), exercises: [], restTimerEndsAt: null }),
  
  loadFromTemplate: (exercises) => set({
    isActive: true,
    startedAt: Date.now(),
    exercises: exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(s => ({ ...s, completed: false })) // Reset completions
    })),
    restTimerEndsAt: null
  }),
  
  endWorkout: () => set({ isActive: false, startedAt: null, exercises: [], restTimerEndsAt: null }),
  
  addExercise: (exercise) => set((state) => {
    if (state.exercises.some(e => e.exercise.id === exercise.id)) return state;
    
    const newWorkoutExercise: WorkoutExercise = {
      exercise,
      sets: [{ id: Math.random().toString(), weight: 0, reps: 0, completed: false }]
    };
    return { exercises: [...state.exercises, newWorkoutExercise] };
  }),
  
  removeExercise: (exerciseId) => set((state) => ({
    exercises: state.exercises.filter(e => e.exercise.id !== exerciseId)
  })),

  addSet: (exerciseId) => set((state) => {
    const exercises = state.exercises.map(ex => {
      if (ex.exercise.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: Math.random().toString(), 
            weight: lastSet ? lastSet.weight : 0, 
            reps: lastSet ? lastSet.reps : 0, 
            completed: false 
          }]
        };
      }
      return ex;
    });
    return { exercises };
  }),

  updateSet: (exerciseId, setId, field, delta) => set((state) => {
    const exercises = state.exercises.map(ex => {
      if (ex.exercise.id === exerciseId) {
        const sets = ex.sets.map(s => {
          if (s.id === setId) {
            const newValue = Math.max(0, s[field] + delta);
            return { ...s, [field]: Number(newValue.toFixed(1)) };
          }
          return s;
        });
        return { ...ex, sets };
      }
      return ex;
    });
    return { exercises };
  }),

  toggleSetComplete: (exerciseId, setId) => {
    let justCompleted = false;
    set((state) => {
      const exercises = state.exercises.map(ex => {
        if (ex.exercise.id === exerciseId) {
          const sets = ex.sets.map(s => {
            if (s.id === setId) {
              const completed = !s.completed;
              if (completed) justCompleted = true;
              return { ...s, completed };
            }
            return s;
          });
          return { ...ex, sets };
        }
        return ex;
      });
      return { exercises };
    });

    if (justCompleted) {
      get().startRestTimer(90);
    }
  },

  removeSet: (exerciseId, setId) => set((state) => {
    const exercises = state.exercises.map(ex => {
      if (ex.exercise.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    });
    return { exercises };
  }),

  startRestTimer: (seconds = 90) => set({
    restTimerEndsAt: Date.now() + seconds * 1000
  }),

  clearRestTimer: () => set({ restTimerEndsAt: null }),
}));
