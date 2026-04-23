"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Media, MediaKind } from "@prisma/client";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadMedia, deleteMedia, type MediaState } from "@/app/(app)/dashboard/media/actions";

type Props = { items: Media[] };

const TABS: { key: MediaKind; label: string; accept: string; hint: string }[] = [
  { key: "PHOTO", label: "Fotos", accept: "image/png,image/jpeg,image/webp,image/avif", hint: "PNG/JPG/WebP hasta 8 MB" },
  { key: "VIDEO", label: "Videos", accept: "video/mp4,video/webm", hint: "MP4 o WebM hasta 120 MB" },
  { key: "TRACK", label: "Tracks", accept: "audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm", hint: "MP3/WAV/OGG hasta 40 MB" },
];

export function MediaGallery({ items }: Props) {
  const [tab, setTab] = useState<MediaKind>("PHOTO");
  const [state, formAction, pending] = useActionState<MediaState, FormData>(uploadMedia, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [deletePending, startDelete] = useTransition();
  const [deletedId, setDeletedId] = useState<string | null>(null);

  const active = TABS.find((t) => t.key === tab)!;
  const filtered = items.filter((m) => m.kind === tab);

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este archivo?")) return;
    setDeletedId(id);
    startDelete(async () => {
      await deleteMedia(id);
      setDeletedId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Tipo de material" className="flex gap-1 rounded-2xl bg-graphite-soft p-1 ring-1 ring-graphite-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            id={`tab-${t.key}`}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              tab === t.key ? "bg-accent text-graphite" : "text-paper-dim hover:text-paper"
            )}
          >
            {t.label} <span className="ml-1 text-xs opacity-70">{items.filter((m) => m.kind === t.key).length}</span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="flex flex-col gap-5"
      >
        <form
          ref={formRef}
          action={async (fd) => {
            await formAction(fd);
            formRef.current?.reset();
          }}
          noValidate
          className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line"
        >
          <input type="hidden" name="kind" value={tab} />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Field id="file" label={`Subir ${active.label.toLowerCase()}`} hint={active.hint}>
              <Input
                key={tab}
                name="file"
                type="file"
                accept={active.accept}
                required
                className="file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:font-semibold file:text-graphite"
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
                <Upload aria-hidden className="mr-2 h-4 w-4" />
                {pending ? "Subiendo…" : "Subir"}
              </Button>
            </div>
          </div>
          <Field id="caption" label="Descripción (opcional)" hint="Máx. 120 caracteres.">
            <Input name="caption" maxLength={120} placeholder="Concierto en Apolo, marzo 2026" />
          </Field>
          {state?.error && (
            <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p role="status" aria-live="polite" className="rounded-lg bg-success/15 p-3 text-sm text-success">
              Archivo subido.
            </p>
          )}
        </form>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-graphite-line p-8 text-center text-sm text-paper-mute">
            Aún no has subido nada en esta categoría.
          </p>
        ) : (
          <ul className={cn(
            "grid gap-4",
            tab === "PHOTO" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
          )}>
            {filtered.map((m) => (
              <li key={m.id} className="group relative overflow-hidden rounded-2xl bg-graphite-soft ring-1 ring-graphite-line">
                {m.kind === "PHOTO" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.caption ?? "Foto del artista"} className="aspect-square w-full object-cover" />
                )}
                {m.kind === "VIDEO" && (
                  <video src={m.url} controls className="aspect-video w-full" aria-label={m.caption ?? "Video"} />
                )}
                {m.kind === "TRACK" && (
                  <div className="p-4">
                    <p className="mb-2 text-sm font-semibold">{m.caption ?? "Track"}</p>
                    <audio src={m.url} controls className="w-full" />
                  </div>
                )}
                {m.kind !== "TRACK" && m.caption && (
                  <p className="px-3 py-2 text-xs text-paper-dim">{m.caption}</p>
                )}
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="danger"
                    aria-label={`Eliminar ${m.caption ?? "archivo"}`}
                    disabled={deletePending && deletedId === m.id}
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
