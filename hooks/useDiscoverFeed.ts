import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useDiscoverFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['discoverFeed', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No auth');

      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendError) throw friendError;

      const friendIds = friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      
      // Excluir amigos aceptados y a uno mismo
      const excludeIds = [...friendIds, user.id]; 

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          name,
          started_at,
          finished_at,
          profiles!workouts_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          workout_exercises (
            id,
            exercises (
              id,
              name,
              muscle_group
            ),
            sets (
              id,
              weight_kg,
              reps
            )
          ),
          likes:workout_likes (
            user_id
          ),
          comments:workout_comments(id)
        `)
        .eq('visibility', 'public')
        .not('user_id', 'in', `(${excludeIds.join(',')})`)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
