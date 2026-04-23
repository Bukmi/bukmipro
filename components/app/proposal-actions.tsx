"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { transitionProposal } from "@/app/(app)/dashboard/propuestas/actions";

type Action = "ACCEPT" | "REJECT" | "BOOK" | "CANCEL" | "NEGOTIATE";

type Props = {
  bookingId: string;
  options: { action: Action; label: string; variant?: "primary" | "secondary" | "danger" | "ghost"; confirm?: string }[];
};

export function ProposalActions({ bookingId, options }: Props) {
  const [pending, start] = useTransition();

  function run(action: Action, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    start(async () => {
      await transitionProposal(bookingId, action);
    });
  }

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Button
          key={o.action}
          type="button"
          size="sm"
          variant={o.variant ?? "primary"}
          disabled={pending}
          onClick={() => run(o.action, o.confirm)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
