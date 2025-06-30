
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CapacityTemplate } from '../types/project';
import { toast } from '@/hooks/use-toast';

export const useCapacityTemplates = () => {
  return useQuery({
    queryKey: ['capacity-templates'],
    queryFn: async (): Promise<CapacityTemplate[]> => {
      const { data, error } = await supabase
        .from('capacity_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching capacity templates:', error);
        throw error;
      }

      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        millworkHours: d.millwork_hours,
        boxConstructionHours: d.box_construction_hours,
        stainHours: d.stain_hours,
        installHours: d.install_hours,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    },
  });
};

export const useCreateCapacityTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<CapacityTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('capacity_templates')
        .insert({
          name: template.name,
          millwork_hours: template.millworkHours,
          box_construction_hours: template.boxConstructionHours,
          stain_hours: template.stainHours,
          install_hours: template.installHours,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capacity-templates'] });
      toast({
        title: "Template Saved",
        description: "Capacity template has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

export const useApplyCapacityTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, dateRange }: { templateId: string; dateRange: { start: Date; end: Date } }) => {
      // Get the template
      const { data: template, error: templateError } = await supabase
        .from('capacity_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError || !template) throw new Error('Template not found');

      // Update capacities for each phase
      const updates = [
        { phase: 'millwork', maxHours: template.millwork_hours },
        { phase: 'boxConstruction', maxHours: template.box_construction_hours },
        { phase: 'stain', maxHours: template.stain_hours },
        { phase: 'install', maxHours: template.install_hours },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('daily_phase_capacities')
          .update({ max_hours: update.maxHours })
          .eq('phase', update.phase);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-phase-capacities'] });
      toast({
        title: "Template Applied",
        description: "Capacity template has been applied to the selected date range.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to apply template: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};
