import { supabase } from '@/integrations/supabase/client';

export const cleanupDoubleBookings = async () => {
  try {
    // First, get all double-bookings
    const { data: doubleBookings, error: queryError } = await supabase
      .rpc('get_double_bookings');
    
    if (queryError) {
      console.error('Error querying double bookings:', queryError);
      return;
    }

    // For each set of duplicate allocations, keep the first one and delete the rest
    for (const booking of doubleBookings || []) {
      const { data: allocations, error: fetchError } = await supabase
        .from('daily_hour_allocations')
        .select('id')
        .eq('team_member_id', booking.team_member_id)
        .eq('date', booking.date)
        .eq('hour_block', booking.hour_block)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching allocations:', fetchError);
        continue;
      }

      // Keep the first allocation, delete the rest
      if (allocations && allocations.length > 1) {
        const toDelete = allocations.slice(1);
        for (const allocation of toDelete) {
          const { error: deleteError } = await supabase
            .from('daily_hour_allocations')
            .delete()
            .eq('id', allocation.id);

          if (deleteError) {
            console.error('Error deleting duplicate allocation:', deleteError);
          }
        }
      }
    }

    console.log('Double-booking cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};
