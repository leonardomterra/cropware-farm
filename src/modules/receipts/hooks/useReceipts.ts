import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import type { Receipt, ReceiptFilters, ReceiptInput } from "../types";

interface UseReceiptsResult {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function filtersToQuery(filters?: ReceiptFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.direction) params.set("direction", filters.direction);
  if (filters.search) params.set("search", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function useReceipts(filters?: ReceiptFilters): UseReceiptsResult {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);
  const query = filtersToQuery(filters);

  const fetchOnce = useCallback(async () => {
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ receipts: Receipt[] }>(`/receipts${query}`);
      // Ignora resposta se outra request mais nova ja foi disparada
      if (myReqId !== reqIdRef.current) return;
      setReceipts(data.receipts ?? []);
    } catch (err) {
      if (myReqId !== reqIdRef.current) return;
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce]);

  return { receipts, loading, error, refetch: fetchOnce };
}

export async function createReceipt(input: ReceiptInput): Promise<Receipt> {
  const data = await api<{ receipt: Receipt }>("/receipts", {
    method: "POST",
    body: input,
  });
  return data.receipt;
}

export async function updateReceipt(
  id: string,
  patch: Partial<ReceiptInput>,
): Promise<Receipt> {
  const data = await api<{ receipt: Receipt }>(`/receipts/${id}`, {
    method: "PATCH",
    body: patch,
  });
  return data.receipt;
}

export async function deleteReceipt(id: string): Promise<void> {
  await api<{ ok: true }>(`/receipts/${id}`, { method: "DELETE" });
}
