"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import type { Venue } from "@prisma/client";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { GENRES } from "@/app/(app)/onboarding/genres";
import { GenrePicker } from "@/components/onboarding/genre-picker";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveVenue, deleteVenue, type EmpresaState } from "@/app/(app)/dashboard/empresa/actions";

export function VenueManager({ venues }: { venues: Venue[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletePending, startDelete] = useTransition();
  const [deletedId, setDeletedId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar este venue?")) return;
    setDeletedId(id);
    startDelete(async () => {
      const res = await deleteVenue(id);
      setDeletedId(null);
      if (res.error) alert(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-paper-mute">
          Venues ({venues.length})
        </h3>
        {!creating && (
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="mr-1 h-4 w-4" /> Añadir venue
          </Button>
        )}
      </div>

      {creating && (
        <VenueEditor
          onClose={() => setCreating(false)}
          onDone={() => setCreating(false)}
        />
      )}

      {venues.length === 0 && !creating ? (
        <p className="rounded-2xl border border-dashed border-graphite-line p-8 text-center text-sm text-paper-mute">
          Todavía no has configurado ningún venue.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {venues.map((v) =>
            editing === v.id ? (
              <li key={v.id}>
                <VenueEditor
                  venue={v}
                  onClose={() => setEditing(null)}
                  onDone={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={v.id}
                className="flex items-center gap-4 rounded-2xl bg-graphite-soft p-4 ring-1 ring-graphite-line"
              >
                <div className="flex-1">
                  <p className="text-sm font-extrabold">{v.name}</p>
                  <p className="text-xs text-paper-dim">
                    {v.city} · aforo {v.capacity} · {v.venueType}
                  </p>
                  {v.defaultGenres.length > 0 && (
                    <p className="mt-1 text-xs text-paper-mute">
                      {v.defaultGenres.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Editar ${v.name}`}
                  onClick={() => setEditing(v.id)}
                >
                  <Pencil aria-hidden className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="danger"
                  aria-label={`Eliminar ${v.name}`}
                  disabled={deletePending && deletedId === v.id}
                  onClick={() => handleDelete(v.id)}
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

function VenueEditor({
  venue,
  onClose,
  onDone,
}: {
  venue?: Venue;
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<EmpresaState, FormData>(saveVenue, {});
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.ok && !pending) {
    onDone();
  }

  return (
    <form
      ref={formRef}
      action={action}
      noValidate
      className="flex flex-col gap-4 rounded-2xl bg-graphite-soft p-5 ring-1 ring-graphite-line"
    >
      {venue && <input type="hidden" name="id" value={venue.id} />}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-extrabold">{venue ? "Editar venue" : "Nuevo venue"}</h4>
        <Button type="button" size="icon" variant="ghost" aria-label="Cerrar" onClick={onClose}>
          <X aria-hidden className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Nombre" required error={state?.fieldErrors?.name}>
          <Input name="name" defaultValue={venue?.name ?? ""} required minLength={2} maxLength={120} />
        </Field>
        <Field id="city" label="Ciudad" required error={state?.fieldErrors?.city}>
          <Input name="city" defaultValue={venue?.city ?? ""} required minLength={2} maxLength={80} autoComplete="address-level2" />
        </Field>
        <Field id="capacity" label="Aforo" required error={state?.fieldErrors?.capacity}>
          <Input name="capacity" type="number" min={1} max={200000} defaultValue={venue?.capacity ?? ""} required />
        </Field>
        <Field id="venueType" label="Tipo" required>
          <select
            id="venueType"
            name="venueType"
            defaultValue={venue?.venueType ?? "sala"}
            className="h-11 rounded-xl border border-graphite-line bg-graphite-soft px-4 text-paper focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-graphite"
          >
            <option value="sala">Sala</option>
            <option value="club">Club</option>
            <option value="festival">Festival</option>
            <option value="teatro">Teatro</option>
            <option value="aire-libre">Aire libre</option>
            <option value="privado">Privado / Corporativo</option>
          </select>
        </Field>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Géneros habituales</p>
        <GenrePicker
          name="defaultGenres"
          options={GENRES}
          defaultValue={venue?.defaultGenres ?? []}
          max={10}
        />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? "Guardando…" : venue ? "Guardar cambios" : "Crear venue"}
        </Button>
      </div>
    </form>
  );
}
