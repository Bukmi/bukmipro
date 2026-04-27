"use client";

/**
 * GDPR cookie consent banner — WCAG 2.1 AA compliant
 *
 * Accessibility contract:
 * - role="alertdialog" aria-modal="false": SR announces the dialog without
 *   trapping focus (users can still navigate the page behind it)
 * - Focus moves to the banner container on first render so keyboard users
 *   are immediately aware of the choice without losing their place
 * - Escape key = "Solo esenciales" (non-destructive default)
 * - "Rechazar" button has the same size/prominence as "Aceptar"
 * - No layout shift: banner renders null on server + first hydration paint
 *   (localStorage is client-only); shown only after useEffect runs
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bukmi-cookie-consent";

export type CookieConsent = "accepted" | "rejected";

export function useCookieConsent(): CookieConsent | null {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CookieConsent | null;
    setConsent(stored);
    const handler = () =>
      setConsent(localStorage.getItem(STORAGE_KEY) as CookieConsent | null);
    window.addEventListener("bukmi:cookie-consent", handler);
    return () => window.removeEventListener("bukmi:cookie-consent", handler);
  }, []);
  return consent;
}

export function CookieBanner() {
  // "pending" = no decision stored; null = not yet read from localStorage
  const [decision, setDecision] = useState<CookieConsent | "pending" | null>(
    null
  );
  const bannerRef = useRef<HTMLDivElement>(null);

  // Read localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CookieConsent | null;
    setDecision(stored ?? "pending");
  }, []);

  // Move focus to the banner so keyboard users are aware of the choice
  useEffect(() => {
    if (decision === "pending") {
      bannerRef.current?.focus();
    }
  }, [decision]);

  // Escape = dismiss as "Solo esenciales"
  useEffect(() => {
    if (decision !== "pending") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") decide("rejected");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision]);

  function decide(value: CookieConsent) {
    localStorage.setItem(STORAGE_KEY, value);
    setDecision(value);
    // Notify other hooks/components listening for consent changes
    window.dispatchEvent(new Event("bukmi:cookie-consent"));
  }

  // Not yet read (SSR / first paint) or already decided — render nothing
  if (decision === null || decision !== "pending") return null;

  return (
    <div
      ref={bannerRef}
      role="alertdialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      tabIndex={-1}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-graphite-line bg-graphite px-4 pb-6 pt-5 shadow-2xl focus:outline-none sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-2xl sm:border"
    >
      {/* Close / reject button */}
      <button
        onClick={() => decide("rejected")}
        aria-label="Cerrar — rechazar cookies opcionales"
        className="absolute right-3 top-3 rounded-lg p-1 text-paper-mute hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
      >
        <X aria-hidden className="h-4 w-4" />
      </button>

      <h2
        id="cookie-banner-title"
        className="pr-6 text-sm font-extrabold text-paper"
      >
        Cookies y privacidad
      </h2>
      <p
        id="cookie-banner-desc"
        className="mt-2 text-xs leading-relaxed text-paper-dim"
      >
        Usamos cookies esenciales para el funcionamiento de la plataforma y,
        con tu permiso, analíticas para mejorar el servicio.{" "}
        <Link
          href="/legal/cookies"
          className="underline underline-offset-2 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:rounded-sm"
        >
          Más información
        </Link>
        .
      </p>

      {/* Equal visual weight for both options (WCAG + GDPR best practice) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => decide("rejected")}
        >
          Solo esenciales
        </Button>
        <Button size="sm" onClick={() => decide("accepted")}>
          Aceptar todo
        </Button>
      </div>
    </div>
  );
}
