import { useCallback, useEffect, useState } from "react";
import { api } from "@/utils/api";
import type { Recurring, RecurringInput } from "../types";

interface ListResponse { recurring: Recurring[] }
interface SingleResponse { recurring: Recurring }
interface RunNowResponse { ok: boolean; processed: number }

export function useRecurring() {
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api<ListResponse>("/recurring", { method: "GET" });
      setItems(r.recurring || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar recorrencias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (input: RecurringInput): Promise<Recurring | null> => {
    try {
      const r = await api<SingleResponse>("/recurring", { method: "POST", body: input });
      await refresh();
      return r.recurring;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar recorrencia");
      return null;
    }
  }, [refresh]);

  const update = useCallback(async (id: string, patch: Partial<RecurringInput>): Promise<boolean> => {
    try {
      await api(`/recurring/${id}`, { method: "PATCH", body: patch });
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
      return false;
    }
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api(`/recurring/${id}`, { method: "DELETE" });
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
      return false;
    }
  }, [refresh]);

  const runNow = useCallback(async (): Promise<number | null> => {
    try {
      const r = await api<RunNowResponse>("/recurring/run-now", { method: "POST", body: {} });
      await refresh();
      return r.processed;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao processar");
      return null;
    }
  }, [refresh]);

  return { items, loading, error, refresh, create, update, remove, runNow };
}
