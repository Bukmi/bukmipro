import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  slug: z.string().min(1).max(120),
  source: z.string().max(40).optional().nullable(),
  referer: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const artist = await prisma.artistProfile.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, published: true },
  });
  if (!artist || !artist.published) return NextResponse.json({ ok: true });

  await prisma.profileView.create({
    data: {
      artistProfileId: artist.id,
      source: parsed.data.source ?? null,
      referer: parsed.data.referer ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
