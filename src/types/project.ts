
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
  status: 'planning' | 'shop' | 'stain' | 'install' | 'completed' | 'custom';
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

export interface DailyPhaseAllocation {
  id: string;
  projectId: string;
  phase: 'millwork' | 'boxConstruction' | 'stain' | 'install';
  date: string;
  allocatedHours: number;
  createdAt: string;
  updatedAt: string;
  project?: Pick<Project, 'id' | 'jobName'>;
}

export interface UnscheduledHours {
  id: string;
  projectId: string;
  phase: 'millwork' | 'boxConstruction' | 'stain' | 'install';
  hours: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  project?: Pick<Project, 'id' | 'jobName'>;
}

export interface DailyPhaseCapacity {
  id: string;
  phase: 'millwork' | 'boxConstruction' | 'stain' | 'install';
  maxHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface CapacityTemplate {
  id: string;
  name: string;
  millworkHours: number;
  boxConstructionHours: number;
  stainHours: number;
  installHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface DayCapacityInfo {
  phase: string;
  allocated: number;
  capacity: number;
  defaultCapacity?: number;
  isOverAllocated: boolean;
  hasOverride?: boolean;
  overrideReason?: string;
  utilizationPercent: number;
}
