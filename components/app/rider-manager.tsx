"use client";

import { useActionState, useRef, useTransition, useState } from "react";
import type { Rider, RiderKind } from "@prisma/client";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { uploadRider, deleteRider, type RiderState } from "@/app/(app)/dashboard/riders/actions";

type Props = { items: Rider[] };

const KIND_LABEL: Record<RiderKind, string> = {
  TECHNICAL: "Rider técnico",
  HOSPITALITY: "Hospitality",
  STAGE_PLOT: "Stage plot",
};

export function RiderManager({ items }: Props) {
  const [state, formAction, pending] = useActionState<RiderState, FormData>(uploadRider, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [deletePending, startDelete] = useTransition();
  const [deletedId, setDeletedId] = useState<string | null>(null);

  function formatSize(bytes?: number | null) {
    if (!bytes) return "";
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este rider?")) return;
    setDeletedId(id);
    startDelete(async () => {
      await deleteRider(id);
      setDeletedId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        action={async (fd) => {
          await formAction(fd);
          formRef.current?.reset();
        }}
        noValidate
        className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="kind" label="Tipo" required>
            <select
              id="kind"
              name="kind"
              defaultValue="TECHNICAL"
              className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
            >
              <option value="TECHNICAL">Rider técnico</option>
              <option value="HOSPITALITY">Hospitality</option>
              <option value="STAGE_PLOT">Stage plot</option>
            </select>
          </Field>
          <Field id="label" label="Nombre visible" required hint="Ej: Rider acústico 2026">
            <Input name="label" required minLength={2} maxLength={120} />
          </Field>
        </div>
        <Field id="file" label="PDF" required hint="Solo PDF. Máximo 15 MB.">
          <Input
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:font-semibold file:text-graphite"
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
            <Upload aria-hidden className="mr-2 h-4 w-4" />
            {pending ? "Subiendo…" : "Subir rider"}
          </Button>
        </div>
        {state?.error && (
          <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" aria-live="polite" className="rounded-lg bg-success/15 p-3 text-sm text-success">
            Rider subido.
          </p>
        )}
      </form>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-graphite-line p-8 text-center text-sm text-paper-mute">
          Todavía no has subido ningún rider.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-4 rounded-2xl bg-graphite-soft p-4 ring-1 ring-graphite-line">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <FileText className="h-5 w-5" />
              </span>
              <div className="flex flex-1 flex-col">
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-paper-mute">
                  {KIND_LABEL[r.kind]} · v{r.version} · {formatSize(r.sizeBytes)}
                </p>
              </div>
              <a
                href={r.url}
                target="_blank"
                rel="noopener"
                className="text-sm font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Abrir
              </a>
              <Button
                type="button"
                size="icon"
                variant="danger"
                aria-label={`Eliminar ${r.label}`}
                disabled={deletePending && deletedId === r.id}
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
