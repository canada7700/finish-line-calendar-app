
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Setting {
  id: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const queryClient = useQueryClient();

  // Fetch all settings
  const { data: settings = [], isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      console.log('Fetching settings from Supabase...');
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) {
        console.error('Error fetching settings:', error);
        throw error;
      }
      
      console.log('Settings fetched:', data);
      return data as Setting[];
    }
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      console.log('Updating setting in Supabase:', { key, value });
      
      // Try to update first, if no rows affected, insert
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating setting:', error);
        throw error;
      }

      console.log('Setting updated successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Settings Updated",
        description: "Settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Failed to update setting:', error);
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Helper function to get a specific setting value
  const getSetting = (key: string, defaultValue: any = null) => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  return {
    settings,
    isLoading,
    error,
    updateSetting: updateSettingMutation.mutate,
    isUpdating: updateSettingMutation.isPending,
    getSetting
  };
};
