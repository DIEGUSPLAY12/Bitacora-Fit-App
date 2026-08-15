import { create } from 'zustand';
import { Exercise, WorkoutExercise } from './workout-store';

interface TemplateBuilderState {
  name: string;
  exercises: WorkoutExercise[];
  
  setName: (name: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', delta: number) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  
  reset: () => void;
}

export const useTemplateBuilderStore = create<TemplateBuilderState>((set) => ({
  name: '',
  exercises: [],

  setName: (name) => set({ name }),

  addExercise: (exercise) => set((state) => {
    if (state.exercises.some(e => e.exercise.id === exercise.id)) return state;
    
    const newWorkoutExercise: WorkoutExercise = {
      exercise,
      // Default set
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

  removeSet: (exerciseId, setId) => set((state) => {
    const exercises = state.exercises.map(ex => {
      if (ex.exercise.id === exerciseId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    });
    return { exercises };
  }),

  reset: () => set({ name: '', exercises: [] })
}));
