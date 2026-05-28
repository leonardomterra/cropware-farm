export interface Recurring {
  id: string;
  organization_id: string;
  cost_center_id: string | null;
  name: string;
  direction: "expense" | "income";
  total_value: number;
  category: string | null;
  vendor: string | null;
  description: string | null;
  payment_method: string | null;
  frequency: "monthly";
  day_of_month: number;
  next_run_date: string;
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringInput {
  name: string;
  direction: "expense" | "income";
  total_value: number;
  cost_center_id?: string | null;
  category?: string | null;
  vendor?: string | null;
  description?: string | null;
  payment_method?: string | null;
  day_of_month: number;
  active?: boolean;
}
