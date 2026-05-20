import { useState } from "react";
import { Plus, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/components/ui/use-mobile";
import { ReceiptFiltersBar } from "../components/ReceiptFiltersBar";
import { ReceiptsTable } from "../components/ReceiptsTable";
import { ReceiptsCards } from "../components/ReceiptsCards";
import { ReceiptFormDialog } from "../components/ReceiptFormDialog";
import { deleteReceipt, useReceipts } from "../hooks/useReceipts";
import type { Receipt, ReceiptFilters } from "../types";
import { formatBRL } from "../utils/receiptFormatters";

export default function ReceiptsPage() {
  const [filters, setFilters] = useState<ReceiptFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Receipt | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { receipts, loading, error, refetch } = useReceipts(filters);
  const isMobile = useIsMobile();

  const totalExpenses = receipts
    .filter((r) => r.direction === "expense")
    .reduce((sum, r) => sum + Number(r.total_value), 0);
  const totalIncome = receipts
    .filter((r) => r.direction === "income")
    .reduce((sum, r) => sum + Number(r.total_value), 0);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (r: Receipt) => {
    setEditing(r);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteReceipt(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
    } catch (err) {
      console.error("[ReceiptsPage] delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Lancamentos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Despesas e receitas da fazenda.
          </p>
        </div>
        <Button variant="default" onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          Novo lancamento
        </Button>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500">Entradas</p>
          <p className="text-base font-semibold text-emerald-700 tabular-nums">
            {formatBRL(totalIncome)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-xs text-slate-500">Saidas</p>
          <p className="text-base font-semibold text-slate-900 tabular-nums">
            {formatBRL(totalExpenses)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-slate-500">Saldo</p>
          <p className="text-base font-semibold text-farm-green-dark tabular-nums">
            {formatBRL(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <ReceiptFiltersBar value={filters} onChange={setFilters} />
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-sm text-slate-500">
          Carregando...
        </div>
      ) : receipts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 flex flex-col items-center text-center gap-3">
          <ReceiptIcon className="size-10 text-slate-300" />
          <div>
            <p className="text-sm font-medium text-slate-900">
              Nenhum lancamento ainda
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Adiciona seu primeiro pelo botao acima. Captura por foto chega no
              proximo commit.
            </p>
          </div>
        </div>
      ) : isMobile ? (
        <ReceiptsCards
          receipts={receipts}
          onEdit={openEdit}
          onDelete={(r) => setPendingDelete(r)}
        />
      ) : (
        <ReceiptsTable
          receipts={receipts}
          onEdit={openEdit}
          onDelete={(r) => setPendingDelete(r)}
        />
      )}

      <ReceiptFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        receipt={editing}
        onSaved={() => {
          void refetch();
        }}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lancamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.vendor || pendingDelete?.description}
              {" - "}
              {pendingDelete ? formatBRL(pendingDelete.total_value) : ""}.
              <br />
              Essa acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
