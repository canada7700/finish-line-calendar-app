
export interface Project {
  id: string;
  jobName: string;
  jobDescription: string;
  shopHrs: number;
  stainHrs: number;
  installHrs: number;
  installDate: string;
  materialOrderDate?: string;
  boxToekickAssemblyDate?: string;
  millingFillersDate?: string;
  stainLacquerDate?: string;
  shopStartDate?: string;
  stainStartDate?: string;
  status: 'planning' | 'shop' | 'stain' | 'install' | 'completed';
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  projectName: string;
  phase: 'shop' | 'stain' | 'install';
  startDate: string;
  endDate: string;
  hours: number;
  color: string;
}
