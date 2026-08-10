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

interface WorkoutState {
  isActive: boolean;
  exercises: Exercise[];
  startWorkout: () => void;
  endWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  isActive: false,
  exercises: [],
  startWorkout: () => set({ isActive: true, exercises: [] }),
  endWorkout: () => set({ isActive: false, exercises: [] }),
  addExercise: (exercise) => set((state) => ({ 
    exercises: [...state.exercises, exercise] 
  })),
  removeExercise: (id) => set((state) => ({
    exercises: state.exercises.filter(e => e.id !== id)
  })),
}));
