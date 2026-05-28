import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import type { Invite, InviteInput, Member } from "../types";
import type { FarmRole } from "@/contexts/AuthContext";

interface MembersResponse { members: Member[] }
interface InvitesResponse { invites: Invite[] }
interface SingleInviteResponse { invite: Invite }

export function useTeam() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, iRes] = await Promise.all([
        api<MembersResponse>("/members", { method: "GET" }),
        api<InvitesResponse>("/invites", { method: "GET" }),
      ]);
      setMembers(mRes.members || []);
      setInvites(iRes.invites || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const createInvite = useCallback(async (input: InviteInput): Promise<Invite | null> => {
    try {
      const r = await api<SingleInviteResponse>("/invites", { method: "POST", body: input });
      await refresh();
      return r.invite;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar convite");
      return null;
    }
  }, [refresh]);

  const revokeInvite = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api(`/invites/${id}`, { method: "DELETE" });
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao revogar convite");
      return false;
    }
  }, [refresh]);

  const updateMember = useCallback(async (userId: string, patch: { role?: FarmRole; cost_center_ids?: string[] }): Promise<boolean> => {
    try {
      await api(`/members/${userId}`, { method: "PATCH", body: patch });
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar membro");
      return false;
    }
  }, [refresh]);

  const removeMember = useCallback(async (userId: string): Promise<boolean> => {
    try {
      await api(`/members/${userId}`, { method: "DELETE" });
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover membro");
      return false;
    }
  }, [refresh]);

  return { members, invites, loading, error, refresh, createInvite, revokeInvite, updateMember, removeMember };
}
