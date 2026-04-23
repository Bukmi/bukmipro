import type { BookingRequest, ProposalStatus } from "@prisma/client";

export type MonthlyBucket = {
  key: string;
  label: string;
  total: number;
  booked: number;
};

export function bucketByMonth(
  bookings: Pick<BookingRequest, "createdAt" | "status">[],
  months = 6
): MonthlyBucket[] {
  const now = new Date();
  const buckets: MonthlyBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit" }).format(d),
      total: 0,
      booked: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const b of bookings) {
    const d = new Date(b.createdAt);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = byKey.get(key);
    if (!bucket) continue;
    bucket.total++;
    if (b.status === "BOOKED") bucket.booked++;
  }
  return buckets;
}

export function statusBreakdown(bookings: { status: ProposalStatus }[]) {
  const counts: Record<ProposalStatus, number> = {
    INQUIRY: 0,
    NEGOTIATING: 0,
    ACCEPTED: 0,
    BOOKED: 0,
    REJECTED: 0,
    CANCELLED: 0,
  };
  for (const b of bookings) counts[b.status]++;
  return counts;
}

export function confirmedAmount(
  bookings: Pick<BookingRequest, "status" | "budgetMax" | "budgetMin">[]
) {
  let total = 0;
  for (const b of bookings) {
    if (b.status !== "BOOKED") continue;
    const v = b.budgetMax ?? b.budgetMin ?? 0;
    total += v;
  }
  return total;
}
