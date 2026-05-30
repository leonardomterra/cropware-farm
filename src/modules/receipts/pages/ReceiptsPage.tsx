import { useState } from "react";
import { toast } from "sonner";
import { Camera, Download, Receipt as ReceiptIcon } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { ReceiptFiltersBar } from "../components/ReceiptFiltersBar";
import { ReceiptsTable } from "../components/ReceiptsTable";
import { ReceiptsCards } from "../components/ReceiptsCards";
import { ReceiptFormDialog } from "../components/ReceiptFormDialog";
import { ReceiptCaptureDialog } from "../components/ReceiptCaptureDialog";
import { deleteReceipt, useReceipts } from "../hooks/useReceipts";
import type { ScanResult } from "../hooks/useReceiptScanner";
import type {
  Receipt,
  ReceiptDirection,
  ReceiptDocType,
  ReceiptFilters,
  ReceiptPaymentMethod,
  ReceiptStatus,
} from "../types";
import { formatBRL, todayISO } from "../utils/receiptFormatters";
import { STATUSES_BY_DIRECTION } from "../constants";
import { downloadCsv, rowsToCsv } from "@/utils/csv";

interface PrefillFromScan {
  values: {
    direction?: ReceiptDirection;
    doc_type?: ReceiptDocType;
    status?: ReceiptStatus;
    total_value?: string;
    vendor?: string;
    category?: string;
    description?: string;
    payment_method?: ReceiptPaymentMethod | "";
    transaction_date?: string;
    invoice_number?: string;
  };
  attachment_key: string;
  attachment_mime: string;
  ai_confidence?: number | null;
  ai_raw?: unknown;
}

function scanToPrefill(scan: ScanResult): PrefillFromScan {
  const e = scan.extracted;
  const direction: ReceiptDirection = e?.direction ?? "expense";
  const defaultStatus = STATUSES_BY_DIRECTION[direction][0];

  return {
    attachment_key: scan.attachment_key,
    attachment_mime: scan.attachment_mime,
    ai_confidence: e?.confidence ?? null,
    ai_raw: e,
    values: {
      direction,
      doc_type: e?.doc_type ?? "cupom",
      status: defaultStatus,
      total_value:
        e?.total_value != null
          ? String(e.total_value).replace(".", ",")
          : "",
      vendor: e?.vendor ?? "",
      category: e?.category ?? "",
      description: e?.description ?? "",
      payment_method: e?.payment_method ?? "",
      transaction_date: e?.transaction_date ?? todayISO(),
      invoice_number: e?.invoice_number ?? "",
    },
  };
}

export default function ReceiptsPage() {
  const { user } = useAuth();
  const userCCs = user?.costCenters ?? [];
  const showTabs = userCCs.length > 1;

  const [filters, setFilters] = useState<ReceiptFilters>({});
  const [activeCCId, setActiveCCId] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [editing, setEditing] = useState<Receipt | null>(null);
  const [prefill, setPrefill] = useState<PrefillFromScan | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Receipt | null>(null);
  const [deleting, setDeleting] = useState(false);

  const effectiveFilters: ReceiptFilters = activeCCId !== "all"
    ? { ...filters, cost_center_id: activeCCId }
    : filters;

  const { receipts, loading, error, refetch } = useReceipts(effectiveFilters);
  const isMobile = useIsMobile();

  const totalExpenses = receipts
    .filter((r) => r.direction === "expense")
    .reduce((sum, r) => sum + Number(r.total_value), 0);
  const totalIncome = receipts
    .filter((r) => r.direction === "income")
    .reduce((sum, r) => sum + Number(r.total_value), 0);

  const openCreate = () => {
    setEditing(null);
    setPrefill(null);
    setFormOpen(true);
  };

  const openEdit = (r: Receipt) => {
    setEditing(r);
    setPrefill(null);
    setFormOpen(true);
  };

  const handleScanComplete = (scan: ScanResult) => {
    setEditing(null);
    setPrefill(scanToPrefill(scan));
    setFormOpen(true);
  };

  const handleExportCsv = () => {
    if (receipts.length === 0) return;
    const ccName = (id: string | null) =>
      id ? (userCCs.find((c) => c.id === id)?.name || "") : "";
    const headers = [
      "data", "tipo", "valor", "categoria", "fornecedor",
      "documento", "pagamento", "status", "vencimento", "pago em",
      "centro de custo", "descricao", "observacoes",
    ];
    const rows = receipts.map((r) => [
      r.transaction_date || "",
      r.direction === "income" ? "receita" : "despesa",
      Number(r.total_value).toFixed(2).replace(".", ","),
      r.category || "",
      r.vendor || "",
      r.invoice_number || "",
      r.payment_method || "",
      r.status,
      r.due_date || "",
      r.paid_date || "",
      ccName(r.cost_center_id),
      r.description || "",
      r.notes || "",
    ]);
    const csv = rowsToCsv(headers, rows);
    const today = todayISO();
    const tag = activeCCId !== "all" ? `_${(userCCs.find((c) => c.id === activeCCId)?.name || "cc").replace(/\s+/g, "-").toLowerCase()}` : "";
    downloadCsv(`lancamentos${tag}_${today}.csv`, csv);
    toast.success(`${receipts.length} lançamento(s) exportado(s)`);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteReceipt(pendingDelete.id);
      setPendingDelete(null);
      await refetch();
      toast.success("Lançamento excluído");
    } catch (err) {
      console.error("[ReceiptsPage] delete failed:", err);
      toast.error("Erro ao excluir. Tente de novo.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Filtros logo abaixo do breadcrumb (pedido Leonardo 2026-05-30). */}
      <div className="mb-3">
        <ReceiptFiltersBar value={filters} onChange={setFilters} />
      </div>

      {/* Action row - botoes abaixo dos filtros, alinhados a esquerda. */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Button variant="default" onClick={openCreate}>
          Novo Lançamento
        </Button>
        <Button
          variant="outline"
          onClick={() => setCaptureOpen(true)}
          className="gap-1"
        >
          <Camera className="size-4" />
          Capturar Recibo
        </Button>
        <Button
          variant="outline"
          onClick={handleExportCsv}
          disabled={receipts.length === 0}
          className="gap-1"
          title="Exportar lançamentos filtrados para CSV (abre no Excel)"
        >
          <Download className="size-4" />
          CSV
        </Button>
      </div>

      {/* Tabs de CC (filtro adicional, so aparece com 2+ CCs no acesso do user) */}
      {showTabs && (
        <div className="mb-3 -mx-1 overflow-x-auto">
          <Tabs value={activeCCId} onValueChange={setActiveCCId}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {userCCs.map((cc) => (
                <TabsTrigger key={cc.id} value={cc.id}>
                  <span
                    className="size-2 rounded-full mr-1.5 inline-block"
                    style={{ backgroundColor: cc.color || "#64748b" }}
                  />
                  {cc.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* KPIs do resultado filtrado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-sm text-slate-500">Entradas</p>
          <p className="text-base font-medium text-emerald-700 tabular-nums">
            {formatBRL(totalIncome)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <p className="text-sm text-slate-500">Saídas</p>
          <p className="text-base font-medium text-slate-900 tabular-nums">
            {formatBRL(totalExpenses)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3 col-span-2 sm:col-span-1">
          <p className="text-sm text-slate-500">Saldo</p>
          <p className="text-base font-medium text-farm-primary tabular-nums">
            {formatBRL(totalIncome - totalExpenses)}
          </p>
        </div>
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
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Adiciona seu primeiro pelo botao "Novo Lançamento" ou tira foto
              de um recibo em "Capturar Recibo".
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-2 px-1">
            Mostrando {receipts.length}{" "}
            {receipts.length === 1 ? "lançamento" : "lançamentos"}
          </p>
          {isMobile ? (
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
        </>
      )}

      <ReceiptFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) {
            setPrefill(null);
            setEditing(null);
          }
        }}
        receipt={editing}
        prefill={prefill}
        onSaved={() => {
          void refetch();
        }}
      />

      <ReceiptCaptureDialog
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onScanComplete={handleScanComplete}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
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
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
