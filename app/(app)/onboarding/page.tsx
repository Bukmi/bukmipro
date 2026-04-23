import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ArtistWizard } from "./artist-wizard";
import { PromoterWizard } from "./promoter-wizard";
import { OfficeWizard } from "./office-wizard";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.onboardingStatus === "COMPLETED") {
    redirect("/dashboard");
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
    </div>
  );
}
