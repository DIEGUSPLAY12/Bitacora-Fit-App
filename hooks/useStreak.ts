import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Obtenemos solo la columna started_at para eficiencia
      const { data, error } = await supabase
        .from('workouts')
        .select('started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return 0;

      // Usar en-CA da el formato YYYY-MM-DD en la zona horaria local
      const dates = Array.from(new Set(data.map(w => {
        return new Date(w.started_at).toLocaleDateString('en-CA');
      })));

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayStr = today.toLocaleDateString('en-CA');
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      // Si no entrenó hoy ni ayer, la racha es 0
      if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
        return 0;
      }

      let streak = 1;
      let currentDate = new Date(dates[0]);
      // Asegurar que lidiamos con la zona horaria local estableciendo hora cero
      currentDate.setHours(0,0,0,0);

      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toLocaleDateString('en-CA');

        if (dates[i] === prevDateStr) {
          streak++;
          currentDate = prevDate;
        } else {
          break;
        }
      }

      return streak;
    },
    enabled: !!user,
  });
}
