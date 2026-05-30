import { useState } from "react";
import { Plus, Pencil, Trash2, Play, Repeat } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRecurring } from "../hooks/useRecurring";
import { useCategories } from "@/modules/receipts/hooks/useCategories";
import type { Recurring, RecurringInput } from "../types";

interface FormState {
  name: string;
  direction: "expense" | "income";
  total_value: string;
  day_of_month: string;
  category: string;
  vendor: string;
  cost_center_id: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  direction: "expense",
  total_value: "",
  day_of_month: "5",
  category: "outros_despesa",
  vendor: "",
  cost_center_id: "",
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-");
  return d && m && y ? `${d}/${m}/${y}` : yyyymmdd;
}

export default function RecurringPage() {
  const { user } = useAuth();
  const ccs = user?.costCenters || [];
  const { items, loading, error, create, update, remove, runNow } = useRecurring();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const { categories: allCategories } = useCategories();
  const showCC = ccs.length > 1;

  // Filtra por direction (expense vs income) e agrupa por group_name
  // preservando ordem (categories ja vem ordenado do hook).
  const groupedCategories = (() => {
    const filtered = allCategories.filter((c) => c.direction === form.direction);
    const groups: { name: string; items: typeof filtered }[] = [];
    for (const c of filtered) {
      const g = c.group_name || "Outras";
      const last = groups[groups.length - 1];
      if (last && last.name === g) last.items.push(c);
      else groups.push({ name: g, items: [c] });
    }
    return groups;
  })();

  function openNew() {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      cost_center_id: ccs.find((c) => c.is_default)?.id || ccs[0]?.id || "",
    });
    setDialogOpen(true);
  }

  function openEdit(r: Recurring) {
    setEditing(r);
    setForm({
      name: r.name,
      direction: r.direction,
      total_value: String(r.total_value),
      day_of_month: String(r.day_of_month),
      category: r.category || (r.direction === "income" ? "outros_receita" : "outros_despesa"),
      vendor: r.vendor || "",
      cost_center_id: r.cost_center_id || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Nome obrigatorio"); return; }
    const total = Number(form.total_value.replace(",", "."));
    if (!Number.isFinite(total) || total <= 0) { toast.error("Valor invalido"); return; }
    const day = Number(form.day_of_month);
    if (!Number.isFinite(day) || day < 1 || day > 28) {
      toast.error("Dia do mes deve estar entre 1 e 28");
      return;
    }
    setSaving(true);
    const payload: RecurringInput = {
      name: form.name.trim(),
      direction: form.direction,
      total_value: total,
      day_of_month: day,
      category: form.category || null,
      vendor: form.vendor.trim() || null,
      cost_center_id: form.cost_center_id || null,
    };
    let ok = false;
    if (editing) {
      ok = await update(editing.id, payload);
    } else {
      const created = await create(payload);
      ok = !!created;
    }
    setSaving(false);
    if (ok) {
      toast.success(editing ? "Recorrência atualizada" : "Recorrência criada");
      setDialogOpen(false);
    }
  }

  async function handleToggleActive(r: Recurring) {
    const ok = await update(r.id, { active: !r.active } as Partial<RecurringInput>);
    if (ok) toast.success(r.active ? "Pausada" : "Reativada");
  }

  async function handleRemove(r: Recurring) {
    if (!confirm(`Remover "${r.name}"? Os lançamentos já gerados continuam.`)) return;
    const ok = await remove(r.id);
    if (ok) toast.success("Removida");
  }

  async function handleRunNow() {
    setRunning(true);
    const n = await runNow();
    setRunning(false);
    if (n !== null) toast.success(`${n} lançamento(s) gerado(s)`);
  }

  const active = items.filter((i) => i.active);
  const inactive = items.filter((i) => !i.active);

  return (
    <div className="max-w-3xl space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-medium text-slate-900">Recorrências</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Contas mensais (energia, internet, salário) que viram lançamento automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRunNow} disabled={running}>
            <Play className="size-4 mr-1" />
            {running ? "Processando..." : "Rodar agora"}
          </Button>
          <Button onClick={openNew}>
            <Plus className="size-4 mr-1" />
            Nova
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded p-6 text-center">
          <Repeat className="size-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Nenhuma recorrencia ainda.</p>
          <p className="text-xs text-slate-500 mt-1">
            Crie uma pra que ela gere lancamentos todo mes automaticamente.
          </p>
        </div>
      ) : (
        <>
          <Section title="Ativas" items={active} {...{ openEdit, handleToggleActive, handleRemove, showCC, ccs }} />
          {inactive.length > 0 && (
            <Section title="Pausadas" items={inactive} faded {...{ openEdit, handleToggleActive, handleRemove, showCC, ccs }} />
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar recorrencia" : "Nova recorrencia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nome</label>
              <Input
                placeholder="Energia, Internet, Salario do Joao..."
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                maxLength={80}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Tipo</label>
                <Select
                  value={form.direction}
                  onValueChange={(v) => setForm((s) => ({
                    ...s,
                    direction: v as "expense" | "income",
                    category: v === "income" ? "outros_receita" : "outros_despesa",
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Valor (R$)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="850,00"
                  value={form.total_value}
                  onChange={(e) => setForm((s) => ({ ...s, total_value: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Dia do mes</label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.day_of_month}
                  onChange={(e) => setForm((s) => ({ ...s, day_of_month: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Categoria</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((s) => ({ ...s, category: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {groupedCategories.map((group) => (
                      <SelectGroup key={group.name}>
                        <SelectLabel className="text-xs uppercase tracking-wide text-slate-400">
                          {group.name}
                        </SelectLabel>
                        {group.items.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Fornecedor (opcional)</label>
              <Input
                placeholder="Cemig, Vivo, Joao Silva..."
                value={form.vendor}
                onChange={(e) => setForm((s) => ({ ...s, vendor: e.target.value }))}
                maxLength={80}
              />
            </div>
            {showCC && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Centro de custo</label>
                <Select
                  value={form.cost_center_id || ""}
                  onValueChange={(v) => setForm((s) => ({ ...s, cost_center_id: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    {ccs.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name}{cc.is_default ? " (padrao)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SectionProps {
  title: string;
  items: Recurring[];
  faded?: boolean;
  openEdit: (r: Recurring) => void;
  handleToggleActive: (r: Recurring) => void;
  handleRemove: (r: Recurring) => void;
  showCC: boolean;
  ccs: Array<{ id: string; name: string }>;
}

function Section({ title, items, faded, openEdit, handleToggleActive, handleRemove, showCC, ccs }: SectionProps) {
  if (items.length === 0) return null;
  const ccName = (id: string | null) => id ? (ccs.find((c) => c.id === id)?.name || "?") : "";
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-slate-500 tracking-wide">{title}</h2>
      <div className={`space-y-2 ${faded ? "opacity-60" : ""}`}>
        {items.map((r) => (
          <div key={r.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-start gap-3">
            <div className={`w-2 self-stretch rounded-sm shrink-0 ${r.direction === "income" ? "bg-emerald-500" : "bg-slate-400"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900 truncate">{r.name}</h3>
                <Badge size="compact" colorScheme={r.direction === "income" ? "emerald" : "slate"}>
                  {r.direction === "income" ? "receita" : "despesa"}
                </Badge>
              </div>
              <div className="text-sm text-slate-700 mt-1">{fmtBRL(r.total_value)} - dia {r.day_of_month}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {r.vendor && <span>{r.vendor} - </span>}
                {r.category}
                {showCC && r.cost_center_id && <span> - {ccName(r.cost_center_id)}</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Proximo lancamento: <span className="font-medium text-slate-700">{fmtDate(r.next_run_date)}</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button type="button" onClick={() => openEdit(r)} className="text-xs text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
                  <Pencil className="size-3" /> Editar
                </button>
                <button type="button" onClick={() => handleToggleActive(r)} className="text-xs text-slate-600 hover:text-slate-900">
                  {r.active ? "Pausar" : "Reativar"}
                </button>
                <button type="button" onClick={() => handleRemove(r)} className="text-xs text-slate-600 hover:text-red-600 inline-flex items-center gap-1 ml-auto">
                  <Trash2 className="size-3" /> Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
