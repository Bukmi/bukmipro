"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProposalStatus } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requirePromoter, requireArtist } from "@/lib/session";
import { proposalSchema, messageSchema } from "@/lib/validation";
import {
  notifyProposalCreated,
  notifyProposalStatusChanged,
  notifyNewMessage,
} from "@/lib/email";

export type ProposalState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createProposal(
  _prev: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  const { promoter } = await requirePromoter();

  const parsed = proposalSchema.safeParse({
    artistProfileId: String(formData.get("artistProfileId") ?? ""),
    venueId: String(formData.get("venueId") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    eventCity: String(formData.get("eventCity") ?? ""),
    venueName: String(formData.get("venueName") ?? ""),
    budgetMin: formData.get("budgetMin") || null,
    budgetMax: formData.get("budgetMax") || null,
    currency: String(formData.get("currency") ?? "EUR"),
    slot: String(formData.get("slot") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  const artist = await prisma.artistProfile.findUnique({
    where: { id: parsed.data.artistProfileId },
    select: {
      id: true,
      published: true,
      stageName: true,
      user: { select: { email: true } },
    },
  });
  if (!artist || !artist.published) {
    return { error: "Artista no disponible." };
  }
  if (parsed.data.venueId) {
    const venue = await prisma.venue.findUnique({ where: { id: parsed.data.venueId } });
    if (!venue || venue.promoterId !== promoter.id) {
      return { error: "Venue no válido." };
    }
  }

  const booking = await prisma.bookingRequest.create({
    data: {
      promoterId: promoter.id,
      artistProfileId: artist.id,
      venueId: parsed.data.venueId,
      eventDate: new Date(`${parsed.data.eventDate}T00:00:00.000Z`),
      eventCity: parsed.data.eventCity,
      venueName: parsed.data.venueName,
      budgetMin: parsed.data.budgetMin ?? null,
      budgetMax: parsed.data.budgetMax ?? null,
      currency: parsed.data.currency,
      slot: parsed.data.slot,
      notes: parsed.data.notes,
      messages: {
        create: {
          sender: "PROMOTER",
          authorUserId: (await auth())!.user.id,
          body: parsed.data.notes,
        },
      },
    },
  });

  if (artist.user.email) {
    await notifyProposalCreated({
      artistEmail: artist.user.email,
      artistName: artist.stageName,
      promoterName: promoter.companyName,
      booking,
    });
  }

  revalidatePath("/dashboard/propuestas");
  redirect(`/dashboard/propuestas/${booking.id}`);
}

export async function sendMessage(
  _prev: ProposalState,
  formData: FormData
): Promise<ProposalState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado." };

  const parsed = messageSchema.safeParse({
    bookingId: String(formData.get("bookingId") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const booking = await loadBookingForUser(parsed.data.bookingId, session.user);
  if (!booking) return { error: "Propuesta no encontrada." };

  const sender = booking.role;
  await prisma.message.create({
    data: {
      bookingId: booking.id,
      sender,
      authorUserId: session.user.id,
      body: parsed.data.body,
    },
  });
  await prisma.bookingRequest.update({
    where: { id: booking.id },
    data: {
      lastActivityAt: new Date(),
      ...(booking.status === "INQUIRY" && sender === "ARTIST"
        ? { status: "NEGOTIATING" as ProposalStatus }
        : {}),
    },
  });

  const full = await prisma.bookingRequest.findUnique({
    where: { id: booking.id },
    include: {
      promoter: { include: { user: { select: { email: true } } } },
      artistProfile: {
        select: { stageName: true, user: { select: { email: true } } },
      },
    },
  });
  if (full) {
    const toEmail = sender === "ARTIST" ? full.promoter.user.email : full.artistProfile.user.email;
    const recipientName =
      sender === "ARTIST" ? full.promoter.companyName : full.artistProfile.stageName;
    if (toEmail) {
      await notifyNewMessage({
        to: toEmail,
        recipientName,
        fromSender: sender,
        preview: parsed.data.body,
        booking: full,
      });
    }
  }

  revalidatePath(`/dashboard/propuestas/${booking.id}`);
  revalidatePath(`/dashboard/propuestas`);
  return { ok: true };
}

export async function transitionProposal(
  bookingId: string,
  action: "ACCEPT" | "REJECT" | "BOOK" | "CANCEL" | "NEGOTIATE"
): Promise<ProposalState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado." };

  const booking = await loadBookingForUser(bookingId, session.user);
  if (!booking) return { error: "Propuesta no encontrada." };

  const next = nextStatus(booking.status, action, booking.role);
  if (!next) return { error: "Acción no permitida en el estado actual." };

  await prisma.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: booking.id },
      data: { status: next, lastActivityAt: new Date() },
    });
    await tx.message.create({
      data: {
        bookingId: booking.id,
        sender: "SYSTEM",
        body: systemMessage(action, booking.role),
      },
    });
    if (next === "BOOKED") {
      await tx.availability.upsert({
        where: {
          artistProfileId_date: {
            artistProfileId: booking.artistProfileId,
            date: booking.eventDate,
          },
        },
        create: {
          artistProfileId: booking.artistProfileId,
          date: booking.eventDate,
          status: "BOOKED",
          note: `Booking ${booking.id}`,
        },
        update: { status: "BOOKED" },
      });
    }
  });

  if (next !== "INQUIRY") {
    const full = await prisma.bookingRequest.findUnique({
      where: { id: booking.id },
      include: {
        promoter: {
          select: { companyName: true, user: { select: { email: true } } },
        },
        artistProfile: {
          select: { stageName: true, user: { select: { email: true } } },
        },
      },
    });
    if (full) {
      const toPromoter = booking.role === "ARTIST";
      const toEmail = toPromoter ? full.promoter.user.email : full.artistProfile.user.email;
      const recipientName = toPromoter ? full.promoter.companyName : full.artistProfile.stageName;
      const actorName = toPromoter ? full.artistProfile.stageName : full.promoter.companyName;
      if (toEmail) {
        await notifyProposalStatusChanged({
          to: toEmail,
          recipientName,
          actorName,
          booking: full,
          newStatus: next as "ACCEPTED" | "REJECTED" | "BOOKED" | "CANCELLED" | "NEGOTIATING",
        });
      }
    }
  }

  revalidatePath(`/dashboard/propuestas/${bookingId}`);
  revalidatePath("/dashboard/propuestas");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}

type AuthUser = { id: string; role: string };

async function loadBookingForUser(bookingId: string, user: AuthUser) {
  const booking = await prisma.bookingRequest.findUnique({
    where: { id: bookingId },
    include: {
      promoter: { select: { userId: true } },
      artistProfile: { select: { userId: true } },
    },
  });
  if (!booking) return null;
  if (user.role === "ARTIST" && booking.artistProfile.userId === user.id) {
    return { ...booking, role: "ARTIST" as const };
  }
  if (
    (user.role === "PROMOTER" || user.role === "OFFICE") &&
    booking.promoter.userId === user.id
  ) {
    return { ...booking, role: "PROMOTER" as const };
  }
  return null;
}

function nextStatus(
  current: ProposalStatus,
  action: "ACCEPT" | "REJECT" | "BOOK" | "CANCEL" | "NEGOTIATE",
  role: "ARTIST" | "PROMOTER"
): ProposalStatus | null {
  if (action === "CANCEL") {
    if (current === "BOOKED" || current === "CANCELLED") return null;
    return "CANCELLED";
  }
  if (action === "REJECT") {
    if (role !== "ARTIST") return null;
    if (current !== "INQUIRY" && current !== "NEGOTIATING") return null;
    return "REJECTED";
  }
  if (action === "ACCEPT") {
    if (role !== "ARTIST") return null;
    if (current !== "INQUIRY" && current !== "NEGOTIATING") return null;
    return "ACCEPTED";
  }
  if (action === "BOOK") {
    if (role !== "PROMOTER") return null;
    if (current !== "ACCEPTED") return null;
    return "BOOKED";
  }
  if (action === "NEGOTIATE") {
    if (current !== "INQUIRY") return null;
    return "NEGOTIATING";
  }
  return null;
}

function systemMessage(
  action: "ACCEPT" | "REJECT" | "BOOK" | "CANCEL" | "NEGOTIATE",
  role: "ARTIST" | "PROMOTER"
) {
  const who = role === "ARTIST" ? "El artista" : "La promotora";
  switch (action) {
    case "ACCEPT":
      return `${who} ha aceptado la propuesta. Pendiente de confirmación.`;
    case "REJECT":
      return `${who} ha rechazado la propuesta.`;
    case "BOOK":
      return `${who} ha confirmado el booking. Fecha reservada en el calendario.`;
    case "CANCEL":
      return `${who} ha cancelado la propuesta.`;
    case "NEGOTIATE":
      return `${who} ha abierto negociación.`;
  }
}

export async function markBookedArtistSide(bookingId: string): Promise<ProposalState> {
  // Shortcut kept for future — currently promoter-only transitions to BOOKED.
  await requireArtist();
  return { error: "Solo la promotora puede confirmar el booking." };
}
