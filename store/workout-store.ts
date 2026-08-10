import { create } from 'zustand';

interface WorkoutState {
  isActive: boolean;
  startWorkout: () => void;
  endWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  isActive: false,
  startWorkout: () => set({ isActive: true }),
  endWorkout: () => set({ isActive: false }),
}));
