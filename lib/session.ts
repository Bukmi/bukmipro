import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireArtist() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ARTIST") redirect("/dashboard");
  const artist = await prisma.artistProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!artist) redirect("/onboarding");
  return { session, artist };
}

export async function requirePromoter() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "PROMOTER" && session.user.role !== "OFFICE") {
    redirect("/dashboard");
  }
  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
    include: { venues: true },
  });
  if (!promoter) redirect("/onboarding");
  return { session, promoter };
}
