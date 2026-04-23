import type { ProposalStatus } from "@prisma/client";

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  INQUIRY: "Nueva",
  NEGOTIATING: "Negociando",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
  BOOKED: "Confirmada",
  CANCELLED: "Cancelada",
};

export const STATUS_TONE: Record<ProposalStatus, string> = {
  INQUIRY: "bg-accent/15 text-accent",
  NEGOTIATING: "bg-accent/15 text-accent",
  ACCEPTED: "bg-success/20 text-success",
  BOOKED: "bg-success/30 text-success",
  REJECTED: "bg-danger/20 text-danger",
  CANCELLED: "bg-graphite-line text-paper-mute",
};

export function isOpen(status: ProposalStatus) {
  return status === "INQUIRY" || status === "NEGOTIATING" || status === "ACCEPTED";
}

export function isFinal(status: ProposalStatus) {
  return status === "BOOKED" || status === "REJECTED" || status === "CANCELLED";
}

export function formatBudget(
  min?: number | null,
  max?: number | null,
  currency = "EUR"
) {
  if (!min && !max) return "Sin presupuesto definido";
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}
