import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ArtistWizard } from "./artist-wizard";
import { PromoterWizard } from "./promoter-wizard";
import { OfficeWizard } from "./office-wizard";
import { skipOnboarding } from "./actions";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.onboardingStatus === "COMPLETED") {
    redirect("/dashboard");
  }

  // Mark as IN_PROGRESS on first visit so abandoners resume instead of restarting
  if (session.user.onboardingStatus === "NOT_STARTED") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingStatus: "IN_PROGRESS" },
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">Onboarding</p>
      <h1 className="mt-2 text-display mb-10">Vamos a montar tu cuenta.</h1>
      {session.user.role === "ARTIST" ? (
        <ArtistWizard defaultEmail={session.user.email ?? ""} />
      ) : session.user.role === "OFFICE" ? (
        <OfficeWizard />
      ) : (
        <PromoterWizard />
      )}

      {session.user.role === "ARTIST" && (
        <div className="mt-10 border-t border-graphite-line pt-6 text-center">
          <form action={skipOnboarding}>
            <button
              type="submit"
              className="text-sm text-paper-mute underline-offset-4 hover:text-paper hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-sm"
            >
              Completar más tarde →
            </button>
          </form>
          <p className="mt-2 text-xs text-paper-mute">
            Podrás rellenar tu perfil desde el dashboard cuando quieras.
          </p>
        </div>
      )}
    </div>
  );
}
