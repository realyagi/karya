export type PlanItemStatus = 'not_started' | 'in_progress' | 'done' | 'skipped';

export interface KaryaPlanItem {
  id: string;
  title: string;
  status: PlanItemStatus;
}

export interface KaryaPlan {
  id: string;
  date: string;
  title: string;
  objectives: string[];
  items: KaryaPlanItem[];
  linkedTaskIds?: string[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}