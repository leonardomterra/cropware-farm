import type { FarmRole } from "@/contexts/AuthContext";

export interface Member {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: FarmRole;
  phone: string | null;
  whatsapp_linked: boolean;
  cost_center_ids: "all" | string[];
  created_at: string;
}

export interface Invite {
  id: string;
  organization_id: string;
  code: string;
  invited_by: string;
  invited_name: string | null;
  invited_email: string | null;
  role: "admin" | "member";
  cost_center_ids: string[];
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface InviteInput {
  invited_name?: string;
  invited_email?: string;
  role: "admin" | "member";
  cost_center_ids: string[];
}

export interface InviteLookup {
  organization_name: string;
  role: "admin" | "member";
  invited_name: string | null;
}
