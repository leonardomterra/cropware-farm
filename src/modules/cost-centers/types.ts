export interface CostCenter {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  color: string | null;
  icon: string | null;
  is_default: boolean;
}

export interface CostCenterInput {
  name: string;
  color?: string | null;
  icon?: string | null;
}

export const CC_COLORS = [
  "#64748b", // slate
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#14b8a6", // teal
];

export const MAX_COST_CENTERS = 6;
