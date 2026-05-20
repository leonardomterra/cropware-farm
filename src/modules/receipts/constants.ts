import type {
  ReceiptDocType,
  ReceiptPaymentMethod,
  ReceiptStatus,
} from "./types";

export const STATUS_LABEL: Record<ReceiptStatus, string> = {
  a_pagar: "A pagar",
  pago: "Pago",
  a_receber: "A receber",
  recebido: "Recebido",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const STATUS_TONE: Record<ReceiptStatus, string> = {
  a_pagar: "bg-amber-100 text-amber-800 border-amber-200",
  pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
  a_receber: "bg-blue-100 text-blue-800 border-blue-200",
  recebido: "bg-emerald-100 text-emerald-800 border-emerald-200",
  vencido: "bg-red-100 text-red-800 border-red-200",
  cancelado: "bg-slate-100 text-slate-600 border-slate-200",
};

export const DOC_TYPE_LABEL: Record<ReceiptDocType, string> = {
  cupom: "Cupom",
  nota_fiscal: "Nota fiscal",
  recibo: "Recibo",
  pix: "PIX",
  boleto: "Boleto",
  outro: "Outro",
};

export const DOC_TYPES: ReceiptDocType[] = [
  "cupom",
  "nota_fiscal",
  "recibo",
  "pix",
  "boleto",
  "outro",
];

export const PAYMENT_METHOD_LABEL: Record<
  NonNullable<ReceiptPaymentMethod>,
  string
> = {
  pix: "PIX",
  cartao: "Cartao",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  transferencia: "Transferencia",
};

export const PAYMENT_METHODS: NonNullable<ReceiptPaymentMethod>[] = [
  "pix",
  "cartao",
  "boleto",
  "dinheiro",
  "transferencia",
];

export const STATUSES_BY_DIRECTION: Record<
  "expense" | "income",
  ReceiptStatus[]
> = {
  expense: ["a_pagar", "pago", "vencido", "cancelado"],
  income: ["a_receber", "recebido", "cancelado"],
};
