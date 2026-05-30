import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import type { Receipt } from "../types";
import { STATUS_COLOR_SCHEME, STATUS_LABEL } from "../constants";
import { useCategories } from "../hooks/useCategories";
import {
  formatBRL,
  formatDateBR,
  getCategoryLabel,
} from "../utils/receiptFormatters";

interface ReceiptsTableProps {
  receipts: Receipt[];
  onView: (r: Receipt) => void;
  onEdit: (r: Receipt) => void;
  onDelete: (r: Receipt) => void;
  /** IDs selecionados (Set pra lookup O(1)). */
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleAll: () => void;
}

/**
 * Tabela de lançamentos no padrão CDM PlotManagement: header branco com
 * border-b leve, células com py-3 (mais respiro vertical), texto em
 * hierarquia de cor slate (primary 700, secondary 600, emphasis 900),
 * coluna "Ações" com botões outline w-9 h-9 (ver / editar / excluir).
 * Suporta seleção em lote via checkbox header + por linha.
 */
export function ReceiptsTable({
  receipts,
  onView,
  onEdit,
  onDelete,
  selectedIds,
  onToggleOne,
  onToggleAll,
}: ReceiptsTableProps) {
  const { categories } = useCategories();
  const allSelected = receipts.length > 0 && receipts.every((r) => selectedIds.has(r.id));

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-200">
            <TableHead className="w-[50px] py-3 pl-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="font-medium text-sm py-3 w-[120px]">
              Data
            </TableHead>
            <TableHead className="font-medium text-sm py-3">
              Fornecedor / Descrição
            </TableHead>
            <TableHead className="font-medium text-sm py-3 w-[180px]">
              Categoria
            </TableHead>
            <TableHead className="font-medium text-sm py-3 w-[120px]">
              Status
            </TableHead>
            <TableHead className="font-medium text-sm py-3 w-[140px] text-right">
              Valor
            </TableHead>
            <TableHead className="font-medium text-sm py-3 w-[160px] text-right pr-4">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((r) => {
            const isSelected = selectedIds.has(r.id);
            return (
              <TableRow
                key={r.id}
                className={cn(
                  "border-b border-slate-200 last:border-b-0",
                  isSelected && "bg-slate-50",
                )}
              >
                <TableCell className="py-3 pl-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleOne(r.id)}
                    aria-label={`Selecionar lançamento de ${r.vendor ?? "fornecedor"}`}
                  />
                </TableCell>
                <TableCell className="py-3 text-sm font-normal text-slate-600 whitespace-nowrap">
                  {formatDateBR(r.transaction_date)}
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm font-normal text-slate-700 truncate block">
                    {r.vendor ?? r.description ?? "(sem fornecedor)"}
                  </span>
                  {r.vendor && r.description ? (
                    <span className="text-xs text-slate-500 truncate block mt-0.5">
                      {r.description}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="py-3 text-sm font-normal text-slate-600">
                  {getCategoryLabel(r.category, categories)}
                </TableCell>
                <TableCell className="py-3">
                  <Badge colorScheme={STATUS_COLOR_SCHEME[r.status]}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-right text-sm font-medium tabular-nums">
                  <span
                    className={
                      r.direction === "income"
                        ? "text-emerald-700"
                        : "text-slate-900"
                    }
                  >
                    {r.direction === "income" ? "+" : ""}
                    {formatBRL(r.total_value)}
                  </span>
                </TableCell>
                <TableCell className="py-3 text-right pr-2">
                  <div className="flex gap-2 justify-end items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-9 h-9 px-0 font-normal shadow-none rounded text-slate-600"
                      onClick={() => onView(r)}
                      aria-label="Ver detalhes"
                      title="Ver detalhes"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-9 h-9 px-0 font-normal shadow-none rounded text-slate-600"
                      onClick={() => onEdit(r)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-9 h-9 px-0 font-normal shadow-none rounded text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                      onClick={() => onDelete(r)}
                      aria-label="Excluir"
                      title="Excluir"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
