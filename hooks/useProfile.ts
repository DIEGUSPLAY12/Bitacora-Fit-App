import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type Profile = {
  id: string;
  username: string;
  avatar_url?: string | null;
  full_name?: string | null;
  birth_date?: string | null;
  goal?: 'muscle' | 'weight_loss' | 'endurance' | 'wellness' | null;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | null;
  weight_unit?: 'kg' | 'lbs';
  is_public?: boolean;
  created_at?: string;
};

export type ProfileUpdates = Partial<Omit<Profile, 'id' | 'created_at'>>;

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetId = userId || user?.id;
  
  return useQuery({
    queryKey: ['profile', targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
        
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!targetId,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: ProfileUpdates) => {
      if (!user) throw new Error('Usuario no autenticado');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    }
  });
}

/** Checks if the current user's profile is complete (onboarding done) */
export function useIsOnboardingComplete() {
  const { data: profile, isLoading } = useProfile();
  const isComplete = !isLoading && !!profile?.full_name && !!profile?.goal && !!profile?.experience_level;
  return { isComplete, isLoading };
}
