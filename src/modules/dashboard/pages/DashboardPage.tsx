import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";

interface Receipt {
  id: string;
  direction: "expense" | "income";
  status: string;
  total_value: number;
  transaction_date: string | null;
  due_date: string | null;
  paid_date: string | null;
  category: string | null;
  vendor: string | null;
  cost_center_id: string | null;
}

interface ReceiptsResponse { receipts: Receipt[] }

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}

function fmtBRLfull(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastSixMonths(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: MONTH_LABELS[d.getMonth()] });
  }
  return out;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName.split(" ")[0] || "fazendeiro";
  const ccs = user?.costCenters || [];
  const showCCFilter = ccs.length > 1;

  const [activeCC, setActiveCC] = useState<string>("all");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        const from = sixMonthsAgo.toISOString().slice(0, 10);
        const r = await api<ReceiptsResponse>(
          `/receipts?from=${from}&limit=500`,
          { method: "GET" },
        );
        if (!cancel) setReceipts(r.receipts || []);
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Filtrar por CC (ou nao).
  const filtered = useMemo(
    () => activeCC === "all" ? receipts : receipts.filter((r) => r.cost_center_id === activeCC),
    [receipts, activeCC],
  );

  // KPIs do mes corrente.
  const now = new Date();
  const currentMonth = monthKey(now);
  const monthKpis = useMemo(() => {
    let income = 0, expense = 0;
    for (const r of filtered) {
      const d = r.paid_date || r.transaction_date;
      if (!d || d.slice(0, 7) !== currentMonth) continue;
      const v = Number(r.total_value) || 0;
      if (r.direction === "income") income += v; else expense += v;
    }
    return { income, expense, balance: income - expense };
  }, [filtered, currentMonth]);

  // Pendentes (a_pagar / a_receber / vencido), agregado em todo o range.
  const pending = useMemo(() => {
    let aPagar = 0, aReceber = 0, vencido = 0;
    for (const r of filtered) {
      const v = Number(r.total_value) || 0;
      if (r.status === "a_pagar") aPagar += v;
      else if (r.status === "a_receber") aReceber += v;
      else if (r.status === "vencido") vencido += v;
    }
    return { aPagar, aReceber, vencido };
  }, [filtered]);

  // Serie de 6 meses.
  const chartData = useMemo(() => {
    const months = lastSixMonths();
    const acc: Record<string, { mes: string; entradas: number; saidas: number }> = {};
    for (const m of months) acc[m.key] = { mes: m.label, entradas: 0, saidas: 0 };
    for (const r of filtered) {
      const d = r.paid_date || r.transaction_date;
      if (!d) continue;
      const k = d.slice(0, 7);
      if (!acc[k]) continue;
      const v = Number(r.total_value) || 0;
      if (r.direction === "income") acc[k].entradas += v;
      else acc[k].saidas += v;
    }
    return months.map((m) => acc[m.key]);
  }, [filtered]);

  // Top 5 categorias de despesa nos ultimos 6 meses.
  const topCategories = useMemo(() => {
    const byCat: Record<string, number> = {};
    for (const r of filtered) {
      if (r.direction !== "expense") continue;
      const cat = r.category || "outros_despesa";
      byCat[cat] = (byCat[cat] || 0) + (Number(r.total_value) || 0);
    }
    return Object.entries(byCat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, total]) => ({ cat, total }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-base font-medium text-slate-900">Ola, {firstName}.</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumo dos ultimos 6 meses.</p>
        </div>
        {showCCFilter && (
          <Tabs value={activeCC} onValueChange={setActiveCC}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              {ccs.map((cc) => (
                <TabsTrigger key={cc.id} value={cc.id}>{cc.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">{error}</div>
      )}

      {/* KPIs mes corrente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Entradas (mês)" value={monthKpis.income} tone="positive" loading={loading} />
        <KpiCard label="Saídas (mês)" value={monthKpis.expense} tone="negative" loading={loading} />
        <KpiCard label="Saldo (mês)" value={monthKpis.balance} tone={monthKpis.balance >= 0 ? "positive" : "negative"} loading={loading} />
      </div>

      {/* Pendentes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <PendingCard label="A pagar" value={pending.aPagar} color="text-slate-700" />
        <PendingCard label="A receber" value={pending.aReceber} color="text-emerald-700" />
        <PendingCard label="Vencido" value={pending.vencido} color="text-red-700" />
      </div>

      {/* Grafico 6 meses */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-[13px] font-medium text-slate-500 tracking-wide mb-3">
          Entradas x Saídas (6 meses)
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtBRL(Number(v))}
              />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 12 }}
                formatter={(value: number) => fmtBRLfull(value)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" fill="#10b981" name="Entradas" radius={[2, 2, 0, 0]} />
              <Bar dataKey="saidas" fill="#64748b" name="Saídas" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top categorias de despesa */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-[13px] font-medium text-slate-500 tracking-wide mb-3">
          Onde mais saiu (6 meses)
        </h2>
        {topCategories.length === 0 ? (
          <p className="text-sm text-slate-500">Sem despesas no periodo.</p>
        ) : (
          <ul className="space-y-2">
            {topCategories.map((c) => {
              const max = topCategories[0].total;
              const pct = max ? Math.max(4, Math.round((c.total / max) * 100)) : 0;
              return (
                <li key={c.cat} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-32 shrink-0">{c.cat}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded">
                    <div className="h-3 rounded bg-slate-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-slate-700 w-24 text-right tabular-nums">
                    {fmtBRLfull(c.total)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, tone, loading }: { label: string; value: number; tone: "positive" | "negative"; loading: boolean }) {
  const color = tone === "positive" ? "text-emerald-700" : "text-slate-900";
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-base font-medium mt-1 ${color}`}>
        {loading ? "..." : fmtBRLfull(value)}
      </p>
    </div>
  );
}

function PendingCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <p className="text-xs text-slate-500 tracking-wide">{label}</p>
      <p className={`text-sm font-medium mt-1 ${color}`}>{fmtBRLfull(value)}</p>
    </div>
  );
}
