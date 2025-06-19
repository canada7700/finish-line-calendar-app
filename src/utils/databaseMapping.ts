
/**
 * Utility for converting camelCase keys to snake_case for database operations
 */

export const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

export const mapProjectToDatabase = (project: any): Record<string, any> => {
  const dbFields: Record<string, any> = {};
  
  // Map project fields to database column names
  const fieldMapping: Record<string, string> = {
    installDate: 'install_date',
    materialOrderDate: 'material_order_date',
    boxToekickAssemblyDate: 'box_toekick_assembly_date',
    millingFillersDate: 'milling_fillers_date',
    stainLacquerDate: 'stain_lacquer_date',
    millworkStartDate: 'millwork_start_date',
    boxConstructionStartDate: 'box_construction_start_date',
    stainStartDate: 'stain_start_date',
    jobName: 'job_name',
    jobDescription: 'job_description',
    millworkHrs: 'millwork_hrs',
    boxConstructionHrs: 'box_construction_hrs',
    stainHrs: 'stain_hrs',
    installHrs: 'install_hrs'
  };

  // Only include fields that exist in the project object
  Object.keys(fieldMapping).forEach(camelKey => {
    if (project[camelKey] !== undefined) {
      dbFields[fieldMapping[camelKey]] = project[camelKey];
    }
  });

  return dbFields;
};
