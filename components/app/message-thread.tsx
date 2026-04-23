"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Message, MessageSender } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendMessage, type ProposalState } from "@/app/(app)/dashboard/propuestas/actions";

type Props = {
  bookingId: string;
  messages: Message[];
  perspective: MessageSender;
  canReply: boolean;
};

export function MessageThread({ bookingId, messages, perspective, canReply }: Props) {
  const [state, formAction, pending] = useActionState<ProposalState, FormData>(
    sendMessage,
    {}
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <section aria-labelledby="thread-heading" className="flex flex-col gap-4">
      <h2 id="thread-heading" className="text-base font-extrabold">Conversación</h2>

      <ol className="flex flex-col gap-3">
        {messages.map((m) => {
          if (m.sender === "SYSTEM") {
            return (
              <li key={m.id} className="self-center rounded-full bg-graphite-line px-4 py-1 text-xs text-paper-mute">
                {m.body}
              </li>
            );
          }
          const mine = m.sender === perspective;
          return (
            <li
              key={m.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                mine ? "self-end bg-accent text-graphite" : "self-start bg-graphite-soft text-paper ring-1 ring-graphite-line"
              )}
            >
              <p className={cn("mb-1 text-xs font-semibold", mine ? "text-graphite/70" : "text-paper-mute")}>
                {m.sender === "ARTIST" ? "Artista" : "Promotora"} ·{" "}
                {new Intl.DateTimeFormat("es-ES", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(m.createdAt)}
              </p>
              <p className="whitespace-pre-line">{m.body}</p>
            </li>
          );
        })}
      </ol>

      {canReply ? (
        <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <label htmlFor="message-body" className="sr-only">Mensaje</label>
          <Textarea
            id="message-body"
            name="body"
            rows={3}
            maxLength={2000}
            required
            placeholder="Escribe tu respuesta…"
          />
          {state?.error && (
            <p role="alert" className="rounded-lg bg-danger/15 p-3 text-sm text-danger">
              {state.error}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? "Enviando…" : "Enviar mensaje"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="rounded-2xl bg-graphite-soft p-4 text-xs text-paper-mute ring-1 ring-graphite-line">
          La conversación está cerrada.
        </p>
      )}
    </section>
  );
}
