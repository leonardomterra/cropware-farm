import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import type { CostCenter, CostCenterInput } from "../types";

interface ListResponse { cost_centers: CostCenter[] }
interface SingleResponse { cost_center: CostCenter }

export function useCostCenters() {
  const { refreshUser } = useAuth();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api<ListResponse>("/cost-centers", { method: "GET" });
      setCostCenters(r.cost_centers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar centros");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (input: CostCenterInput): Promise<CostCenter | null> => {
    try {
      const r = await api<SingleResponse>("/cost-centers", { method: "POST", body: input });
      await refresh();
      await refreshUser();
      return r.cost_center;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao criar centro";
      if (msg.includes("max_cost_centers_reached")) {
        setError("Você atingiu o limite de 6 centros. Arquive um antes de criar outro.");
      } else if (msg.includes("duplicate_slug")) {
        setError("Já existe um centro com esse nome. Escolha outro.");
      } else {
        setError(msg);
      }
      return null;
    }
  }, [refresh, refreshUser]);

  const update = useCallback(async (id: string, patch: Partial<CostCenterInput> & { is_default?: boolean }): Promise<boolean> => {
    try {
      await api(`/cost-centers/${id}`, { method: "PATCH", body: patch });
      await refresh();
      await refreshUser();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar centro");
      return false;
    }
  }, [refresh, refreshUser]);

  const archive = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api(`/cost-centers/${id}/archive`, { method: "POST", body: {} });
      await refresh();
      await refreshUser();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao arquivar centro");
      return false;
    }
  }, [refresh, refreshUser]);

  return { costCenters, loading, error, refresh, create, update, archive };
}
