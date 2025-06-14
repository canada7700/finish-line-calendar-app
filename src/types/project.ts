
export interface Project {
  id: string;
  jobName: string;
  jobDescription: string;
  millworkHrs: number;
  boxConstructionHrs: number;
  stainHrs: number;
  installHrs: number;
  installDate: string;
  materialOrderDate?: string;
  boxToekickAssemblyDate?: string;
  millingFillersDate?: string;
  stainLacquerDate?: string;
  millworkStartDate?: string;
  boxConstructionStartDate?: string;
  stainStartDate?: string;
  status: 'planning' | 'shop' | 'stain' | 'install' | 'completed';
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  projectName: string;
  phase: 'materialOrder' | 'millwork' | 'boxConstruction' | 'stain' | 'install';
  startDate: string;
  endDate: string;
  hours: number;
  color: string;
  assignedMembers?: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  weeklyHours: number;
  hourlyRate?: number;
  canDoShop: boolean;
  canDoStain: boolean;
  canDoInstall: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAssignment {
  id: string;
  projectId: string;
  teamMemberId: string;
  phase: 'shop' | 'stain' | 'install';
  assignedHours: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface DailyNote {
  id: string;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
}
