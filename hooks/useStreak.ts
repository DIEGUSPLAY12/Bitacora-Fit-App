import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async () => {
      const defaultStats = { current: 0, longest: 0, total: 0 };
      if (!user) return defaultStats;

      const { data, error } = await supabase
        .from('workouts')
        .select('started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return defaultStats;

      const total = data.length;

      const dates = Array.from(new Set(data.map(w => {
        return new Date(w.started_at).toLocaleDateString('en-CA');
      })));

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayStr = today.toLocaleDateString('en-CA');
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      let current = 0;
      let longest = 0;

      let tempStreak = 1;
      let currentDateObj = new Date(dates[0]);
      currentDateObj.setHours(0,0,0,0);

      const firstDateIsActive = (dates[0] === todayStr || dates[0] === yesterdayStr);

      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(currentDateObj);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toLocaleDateString('en-CA');

        if (dates[i] === prevDateStr) {
          tempStreak++;
          currentDateObj = prevDate;
        } else {
          // Evaluar si esta era la actual
          if (i === tempStreak && firstDateIsActive) {
            current = tempStreak;
          }
          if (tempStreak > longest) longest = tempStreak;
          
          tempStreak = 1;
          currentDateObj = new Date(dates[i]);
          currentDateObj.setHours(0,0,0,0);
        }
      }

      if (dates.length === tempStreak && firstDateIsActive) {
         current = tempStreak;
      }
      if (tempStreak > longest) longest = tempStreak;

      if (current === 0 && firstDateIsActive) {
        current = 1;
      }

      return { current, longest, total };
    },
    enabled: !!user,
  });
}
