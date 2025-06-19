import { supabase } from '@/integrations/supabase/client';

export const cleanupDoubleBookings = async () => {
  try {
    // First, get all allocations grouped by team_member_id, date, and hour_block
    const { data: allAllocations, error: queryError } = await supabase
      .from('daily_hour_allocations')
      .select('id, team_member_id, date, hour_block, created_at')
      .order('team_member_id')
      .order('date')
      .order('hour_block')
      .order('created_at');
    
    if (queryError) {
      console.error('Error querying allocations:', queryError);
      return;
    }

    if (!allAllocations) {
      console.log('No allocations found');
      return;
    }

    // Group allocations by team_member_id, date, and hour_block
    const groupedAllocations = allAllocations.reduce((acc, allocation) => {
      const key = `${allocation.team_member_id}-${allocation.date}-${allocation.hour_block}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(allocation);
      return acc;
    }, {} as Record<string, typeof allAllocations>);

    // Find groups with more than one allocation (double bookings)
    const doubleBookings = Object.values(groupedAllocations).filter(group => group.length > 1);

    if (doubleBookings.length === 0) {
      console.log('No double bookings found');
      return;
    }

    console.log(`Found ${doubleBookings.length} double booking groups`);

    // For each group of duplicate allocations, keep the first one and delete the rest
    for (const group of doubleBookings) {
      // Sort by created_at to keep the earliest allocation
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Keep the first allocation, delete the rest
      const toDelete = group.slice(1);
      
      console.log(`Keeping allocation ${group[0].id}, deleting ${toDelete.length} duplicates`);
      
      for (const allocation of toDelete) {
        const { error: deleteError } = await supabase
          .from('daily_hour_allocations')
          .delete()
          .eq('id', allocation.id);

        if (deleteError) {
          console.error('Error deleting duplicate allocation:', deleteError);
        } else {
          console.log(`Deleted duplicate allocation ${allocation.id}`);
        }
      }
    }

    console.log('Double-booking cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};
