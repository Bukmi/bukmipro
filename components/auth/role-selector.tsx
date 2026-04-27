"use client";

import * as React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import { Mic2, Building2, Briefcase, CheckCircle2 } from "lucide-react";

type Role = "ARTIST" | "PROMOTER" | "OFFICE";

const options: { value: Role; title: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "ARTIST", title: "Artista", desc: "Individual o banda, con o sin mánager.", Icon: Mic2 },
  { value: "PROMOTER", title: "Promotora", desc: "Sala, festival o organizadora de eventos.", Icon: Building2 },
  { value: "OFFICE", title: "Oficina", desc: "Mánager, sello o agencia multi-artista.", Icon: Briefcase },
];

type Props = {
  name: string;
  value?: Role;
  defaultValue?: Role;
  onValueChange?: (v: Role) => void;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
};

export function RoleSelector({ name, value, defaultValue, onValueChange, ...aria }: Props) {
  return (
    <RadioGroup.Root
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => onValueChange?.(v as Role)}
      className="grid gap-3 sm:grid-cols-3"
      {...aria}
    >
      {options.map(({ value: v, title, desc, Icon }) => (
        <RadioGroup.Item
          key={v}
          value={v}
          className={cn(
            "group relative flex flex-col gap-3 rounded-2xl border border-graphite-line bg-graphite-soft p-5 text-left transition-colors",
            "hover:border-paper/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite",
            "data-[state=checked]:border-2 data-[state=checked]:border-accent data-[state=checked]:bg-accent/10"
          )}
        >
          {/* Non-chromatic check mark — visible for low-colour-vision users */}
          <CheckCircle2
            aria-hidden
            className="absolute right-3 top-3 h-4 w-4 text-accent opacity-0 group-data-[state=checked]:opacity-100 transition-opacity"
          />
          <Icon aria-hidden className="h-6 w-6 text-paper group-data-[state=checked]:text-accent" />
          <div>
            <p className="font-extrabold">{title}</p>
            <p className="text-xs text-paper-dim">{desc}</p>
          </div>
          <RadioGroup.Indicator asChild>
            <span className="sr-only">Seleccionado</span>
          </RadioGroup.Indicator>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
