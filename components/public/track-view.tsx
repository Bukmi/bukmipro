"use client";

import { useEffect } from "react";

export function TrackView({ slug, source }: { slug: string; source?: string }) {
  useEffect(() => {
    const key = `bukmi:view:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // sessionStorage not available — still track once per navigation
    }

    const controller = new AbortController();
    fetch(`/api/track/view`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        source: source ?? null,
        referer: typeof document !== "undefined" ? document.referrer || null : null,
      }),
      signal: controller.signal,
    }).catch(() => {});

    return () => controller.abort();
  }, [slug, source]);

  return null;
}
