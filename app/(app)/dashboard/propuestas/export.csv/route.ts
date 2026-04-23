import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/proposal";

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", "http://localhost"));
  }
  const role = session.user.role;

  type Row = {
    id: string;
    createdAt: Date;
    eventDate: Date;
    eventCity: string;
    venueName: string;
    status: import("@prisma/client").ProposalStatus;
    budgetMin: number | null;
    budgetMax: number | null;
    currency: string;
    counterparty: string;
  };
  let rows: Row[] = [];

  if (role === "ARTIST") {
    const artist = await prisma.artistProfile.findUnique({
      where: { userId: session.user.id! },
      select: { id: true },
    });
    if (!artist) return new NextResponse("Forbidden", { status: 403 });
    const list = await prisma.bookingRequest.findMany({
      where: { artistProfileId: artist.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        eventDate: true,
        eventCity: true,
        venueName: true,
        status: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        promoter: { select: { companyName: true } },
      },
    });
    rows = list.map((b) => ({
      id: b.id,
      createdAt: b.createdAt,
      eventDate: b.eventDate,
      eventCity: b.eventCity,
      venueName: b.venueName,
      status: b.status,
      budgetMin: b.budgetMin,
      budgetMax: b.budgetMax,
      currency: b.currency,
      counterparty: b.promoter.companyName,
    }));
  } else if (role === "PROMOTER" || role === "OFFICE") {
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id! },
      select: { id: true },
    });
    if (!promoter) return new NextResponse("Forbidden", { status: 403 });
    const list = await prisma.bookingRequest.findMany({
      where: { promoterId: promoter.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        eventDate: true,
        eventCity: true,
        venueName: true,
        status: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        artistProfile: { select: { stageName: true } },
      },
    });
    rows = list.map((b) => ({
      id: b.id,
      createdAt: b.createdAt,
      eventDate: b.eventDate,
      eventCity: b.eventCity,
      venueName: b.venueName,
      status: b.status,
      budgetMin: b.budgetMin,
      budgetMax: b.budgetMax,
      currency: b.currency,
      counterparty: b.artistProfile.stageName,
    }));
  } else {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const header = [
    "id",
    "creada",
    "fecha_evento",
    "ciudad",
    "recinto",
    "contraparte",
    "estado",
    "presupuesto_min",
    "presupuesto_max",
    "moneda",
  ].join(",");

  const isoDate = (d: Date) => d.toISOString().slice(0, 10);
  const body = rows
    .map((r) =>
      [
        csvEscape(r.id),
        csvEscape(isoDate(r.createdAt)),
        csvEscape(isoDate(r.eventDate)),
        csvEscape(r.eventCity),
        csvEscape(r.venueName),
        csvEscape(r.counterparty),
        csvEscape(STATUS_LABEL[r.status]),
        csvEscape(r.budgetMin),
        csvEscape(r.budgetMax),
        csvEscape(r.currency),
      ].join(",")
    )
    .join("\n");

  const csv = `${header}\n${body}\n`;
  const filename = `bukmi-propuestas-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
