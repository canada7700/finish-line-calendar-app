
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  created_at: string;
}

export const useHolidays = () => {
  const queryClient = useQueryClient();

  // Fetch all holidays
  const { data: holidays = [], isLoading, error } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      console.log('Fetching holidays from Supabase...');
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching holidays:', error);
        throw error;
      }
      
      console.log('Holidays fetched:', data);
      return data as Holiday[];
    }
  });

  // Add holiday mutation
  const addHolidayMutation = useMutation({
    mutationFn: async (holidayData: { name: string; date: string }) => {
      console.log('Adding holiday to Supabase:', holidayData);
      const { data, error } = await supabase
        .from('holidays')
        .insert({
          name: holidayData.name,
          date: holidayData.date
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding holiday:', error);
        throw error;
      }

      console.log('Holiday added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({
        title: "Holiday Added",
        description: "Holiday has been added successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to add holiday:', error);
      toast({
        title: "Error",
        description: "Failed to add holiday. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete holiday mutation
  const deleteHolidayMutation = useMutation({
    mutationFn: async (holidayId: string) => {
      console.log('Deleting holiday from Supabase:', holidayId);
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', holidayId);

      if (error) {
        console.error('Error deleting holiday:', error);
        throw error;
      }

      console.log('Holiday deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({
        title: "Holiday Deleted",
        description: "Holiday has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to delete holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete holiday. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    holidays,
    isLoading,
    error,
    addHoliday: addHolidayMutation.mutate,
    deleteHoliday: deleteHolidayMutation.mutate,
    isAddingHoliday: addHolidayMutation.isPending,
    isDeletingHoliday: deleteHolidayMutation.isPending
  };
};
