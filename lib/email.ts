// Stub de email. En dev imprime en consola; en producción integra Resend (Sprint 5).

import type { BookingRequest, MessageSender } from "@prisma/client";

type Payload = { to: string; subject: string; body: string };

async function send({ to, subject, body }: Payload) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(
      `\n[Bukmi · email] para ${to}\n  Asunto: ${subject}\n  ${body.split("\n").join("\n  ")}\n`
    );
    return { ok: true, mocked: true as const };
  }
  // TODO: implementar con Resend (requiere RESEND_API_KEY).
  return { ok: true, mocked: false as const };
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  return send({
    to,
    subject: "Verifica tu cuenta de Bukmi",
    body: `Hola,\n\nHaz clic para verificar tu email:\n${verifyUrl}\n\nEl enlace caduca en 24 horas.`,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return send({
    to,
    subject: "Restablecer tu contraseña de Bukmi",
    body: `Hola,\n\nHemos recibido una solicitud para restablecer tu contraseña.\n\nAbre este enlace para elegir una nueva:\n${resetUrl}\n\nSi no fuiste tú, ignora este mensaje. El enlace caduca en 1 hora.`,
  });
}

type ProposalSummary = Pick<
  BookingRequest,
  | "id"
  | "eventDate"
  | "eventCity"
  | "venueName"
  | "budgetMin"
  | "budgetMax"
  | "currency"
>;

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function formatBudget(min: number | null, max: number | null, currency: string) {
  if (!min && !max) return "Por definir";
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

function appUrl(path: string) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

export async function notifyProposalCreated(args: {
  artistEmail: string;
  artistName: string;
  promoterName: string;
  booking: ProposalSummary;
}) {
  return send({
    to: args.artistEmail,
    subject: `${args.promoterName} te ha enviado una propuesta`,
    body: [
      `Hola ${args.artistName},`,
      "",
      `${args.promoterName} quiere contratarte para el ${formatDate(args.booking.eventDate)} en ${args.booking.venueName} (${args.booking.eventCity}).`,
      `Presupuesto: ${formatBudget(args.booking.budgetMin, args.booking.budgetMax, args.booking.currency)}.`,
      "",
      `Revisa y responde: ${appUrl(`/dashboard/propuestas/${args.booking.id}`)}`,
    ].join("\n"),
  });
}

export async function notifyProposalStatusChanged(args: {
  to: string;
  recipientName: string;
  actorName: string;
  booking: ProposalSummary;
  newStatus: "ACCEPTED" | "REJECTED" | "BOOKED" | "CANCELLED" | "NEGOTIATING";
}) {
  const subjectMap: Record<typeof args.newStatus, string> = {
    ACCEPTED: `${args.actorName} aceptó la propuesta`,
    REJECTED: `${args.actorName} rechazó la propuesta`,
    BOOKED: `Booking confirmado con ${args.actorName}`,
    CANCELLED: `${args.actorName} canceló la propuesta`,
    NEGOTIATING: `${args.actorName} abrió negociación`,
  };
  return send({
    to: args.to,
    subject: subjectMap[args.newStatus],
    body: [
      `Hola ${args.recipientName},`,
      "",
      `Actualización sobre la propuesta del ${formatDate(args.booking.eventDate)} en ${args.booking.venueName}.`,
      "",
      args.newStatus === "BOOKED"
        ? `Fecha confirmada. Descarga el contrato: ${appUrl(`/dashboard/propuestas/${args.booking.id}/contrato`)}`
        : `Revisa los detalles: ${appUrl(`/dashboard/propuestas/${args.booking.id}`)}`,
    ].join("\n"),
  });
}

export async function notifyNewMessage(args: {
  to: string;
  recipientName: string;
  fromSender: Exclude<MessageSender, "SYSTEM">;
  preview: string;
  booking: Pick<BookingRequest, "id" | "venueName" | "eventDate">;
}) {
  const fromLabel = args.fromSender === "PROMOTER" ? "la promotora" : "el artista";
  return send({
    to: args.to,
    subject: `Nuevo mensaje sobre el booking del ${formatDate(args.booking.eventDate)}`,
    body: [
      `Hola ${args.recipientName},`,
      "",
      `Has recibido un mensaje de ${fromLabel} sobre el evento en ${args.booking.venueName}:`,
      "",
      `  "${args.preview.slice(0, 160)}${args.preview.length > 160 ? "…" : ""}"`,
      "",
      `Responde: ${appUrl(`/dashboard/propuestas/${args.booking.id}`)}`,
    ].join("\n"),
  });
}
