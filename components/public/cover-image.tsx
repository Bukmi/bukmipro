"use client";

import { useState } from "react";

export function CoverImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-paper-mute">
        Sin foto
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
      onError={() => setFailed(true)}
    />
  );
}
