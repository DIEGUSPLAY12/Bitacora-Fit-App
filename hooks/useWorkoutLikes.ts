import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import * as Haptics from 'expo-haptics';

export function useToggleLike() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, hasLiked }: { workoutId: string; hasLiked: boolean }) => {
      if (!user) throw new Error('No auth');
      
      if (hasLiked) {
        // Quitar like
        const { error } = await supabase
          .from('workout_likes')
          .delete()
          .eq('workout_id', workoutId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Dar like
        const { error } = await supabase
          .from('workout_likes')
          .insert({ workout_id: workoutId, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: async ({ workoutId, hasLiked }) => {
      if (!user) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cancelar refetches en curso para no sobrescribir nuestra actualización optimista
      await queryClient.cancelQueries({ queryKey: ['friendsFeed'] });
      await queryClient.cancelQueries({ queryKey: ['discoverFeed'] });

      const updateFeed = (oldData: any[]) => {
        if (!oldData) return [];
        return oldData.map((workout) => {
          if (workout.id === workoutId) {
            const likes = workout.likes || [];
            let newLikes;
            if (hasLiked) {
              // Quitar like optimista
              newLikes = likes.filter((l: any) => l.user_id !== user.id);
            } else {
              // Añadir like optimista
              newLikes = [...likes, { user_id: user.id }];
            }
            return { ...workout, likes: newLikes };
          }
          return workout;
        });
      };

      // Guardar el estado previo para poder hacer rollback
      const previousFriendsFeed = queryClient.getQueryData(['friendsFeed', user.id]);
      const previousDiscoverFeed = queryClient.getQueryData(['discoverFeed', user.id]);

      // Actualizar optimísticamente
      queryClient.setQueryData(['friendsFeed', user.id], updateFeed);
      queryClient.setQueryData(['discoverFeed', user.id], updateFeed);

      return { previousFriendsFeed, previousDiscoverFeed };
    },
    onError: (err, variables, context) => {
      // Revertir en caso de error
      if (context?.previousFriendsFeed && user) {
        queryClient.setQueryData(['friendsFeed', user.id], context.previousFriendsFeed);
      }
      if (context?.previousDiscoverFeed && user) {
        queryClient.setQueryData(['discoverFeed', user.id], context.previousDiscoverFeed);
      }
    },
    onSettled: () => {
      // Invalida para asegurar sincronización en background
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['friendsFeed', user.id] });
        queryClient.invalidateQueries({ queryKey: ['discoverFeed', user.id] });
      }
    }
  });
}
