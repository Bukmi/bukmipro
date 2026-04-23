import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  let db: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }
  return NextResponse.json(
    {
      status: db === "ok" ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      checks: {
        db,
        stripe: isStripeConfigured() ? "ok" : "disabled",
      },
      latencyMs: Date.now() - started,
      env: process.env.NODE_ENV,
    },
    {
      status: db === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
