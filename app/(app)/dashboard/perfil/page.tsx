import { requireArtist } from "@/lib/session";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const { artist } = await requireArtist();
  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Perfil de artista</p>
        <h1 className="text-hero">Editor de perfil</h1>
        <p className="text-paper-dim">
          Lo que guardes aparece en tu perfil público y en el buscador de
          promotoras.
        </p>
      </header>
      <ProfileForm profile={artist} />
    </section>
  );
}
