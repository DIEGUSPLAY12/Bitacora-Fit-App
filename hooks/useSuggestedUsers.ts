import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Returns up to 10 random public profiles that are not already
 * friends with the current user and are not the user themselves.
 */
export function useSuggestedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suggestedUsers', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all friendship-related user IDs
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      const relatedIds = new Set<string>([user.id]);
      (friendships || []).forEach(f => {
        relatedIds.add(f.user_id);
        relatedIds.add(f.friend_id);
      });

      // Fetch public profiles not in the related set
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, full_name, goal, experience_level')
        .eq('is_public', true)
        .not('id', 'in', `(${Array.from(relatedIds).join(',')})`)
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // cache 5 min
  });
}
