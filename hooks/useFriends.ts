import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSearchUsers(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['searchUsers', query, user?.id],
    queryFn: async () => {
      if (!user || !query.trim()) return [];

      // 1. Buscar perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user.id)
        .limit(20);

      if (profilesError) throw profilesError;
      if (!profiles.length) return [];

      // 2. Obtener amistades o solicitudes del usuario actual
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id, status')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // 3. Filtrar perfiles que ya son amigos o tienen solicitudes (pendientes o aceptadas)
      const relatedUserIds = new Set(
        friendships.map(f => (f.user_id === user.id ? f.friend_id : f.user_id))
      );

      return profiles.filter(p => !relatedUserIds.has(p.id));
    },
    enabled: !!user && query.trim().length > 0,
  });
}

export function useFriendRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friendRequests', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No auth');

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          status,
          profiles!friendships_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSendFriendRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('No auth');

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
    }
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    }
  });
}

export function useFriendsFeed() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friendsFeed', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No auth');

      // 1. Obtener los IDs de los amigos del usuario (status='accepted')
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendError) throw friendError;

      const friendIds = friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id);

      if (friendIds.length === 0) return [];

      // 2. Obtener los workouts de esos amigos
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
        .in('user_id', friendIds)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}



export function useFriends() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No auth');

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          user_id,
          friend_id,
          requester:profiles!friendships_user_id_fkey(id, username, avatar_url),
          addressee:profiles!friendships_friend_id_fkey(id, username, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) throw error;

      return data.map(f => f.user_id === user.id ? f.addressee : f.requester);
    },
    enabled: !!user,
  });
}

export function useSuggestedProfiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['suggestedProfiles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (friendError) throw friendError;

      const excludeIds = new Set([
        user.id,
        ...friendships.map(f => f.user_id === user.id ? f.friend_id : f.user_id)
      ]);

      const excludeString = `(${Array.from(excludeIds).join(',')})`;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .not('id', 'in', excludeString)
        .limit(6);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRemoveFriend() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: string) => {
      if (!user) throw new Error('No auth');

      // La amistad puede estar en cualquier sentido: user_id/friend_id o friend_id/user_id
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
        );

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendsFeed'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedProfiles'] });
    },
  });
}

