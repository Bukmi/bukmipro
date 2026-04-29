/**
 * Bio enrichment — tries a chain of free public APIs to find a bio for an artist.
 * Fallback chain: Last.fm → Wikipedia → Google Knowledge Graph
 */

export type BioResult = {
  bio: string;
  source: "lastfm" | "wikipedia" | "google" | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxChars = 800): string {
  if (text.length <= maxChars) return text;
  const cut = text.lastIndexOf(" ", maxChars);
  return (cut > 0 ? text.slice(0, cut) : text.slice(0, maxChars)).trimEnd() + "…";
}

// Strip Last.fm's appended "Read more on Last.fm" footer link
function cleanLastfmBio(raw: string): string {
  return raw
    .replace(/<a href="https?:\/\/www\.last\.fm\/.*?<\/a>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Source 1: Last.fm
// ---------------------------------------------------------------------------

async function fromLastfm(artistName: string): Promise<string | null> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "artist.getinfo");
    url.searchParams.set("artist", artistName);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("lang", "es");

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const summary: string | undefined = data?.artist?.bio?.summary;
    if (!summary || summary.trim().length < 50) return null;

    return truncate(cleanLastfmBio(summary));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 2: Wikipedia REST API
// ---------------------------------------------------------------------------

async function fromWikipedia(artistName: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(artistName);
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { next: { revalidate: 86400 } }
    );

    if (res.status === 404) {
      // Try English Wikipedia as fallback
      const resEn = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
        { next: { revalidate: 86400 } }
      );
      if (!resEn.ok) return null;
      const dataEn = await resEn.json();
      const extract: string | undefined = dataEn?.extract;
      if (!extract || extract.length < 50) return null;
      return truncate(extract);
    }

    if (!res.ok) return null;
    const data = await res.json();
    const extract: string | undefined = data?.extract;
    if (!extract || extract.length < 50) return null;
    return truncate(extract);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 3: Google Knowledge Graph
// ---------------------------------------------------------------------------

async function fromGoogleKG(artistName: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_KG_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://kgsearch.googleapis.com/v1/entities:search");
    url.searchParams.set("query", artistName);
    url.searchParams.set("types", "MusicGroup,Person");
    url.searchParams.set("limit", "1");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const description: string | undefined =
      data?.itemListElement?.[0]?.result?.detailedDescription?.articleBody ??
      data?.itemListElement?.[0]?.result?.description;

    if (!description || description.length < 30) return null;
    return truncate(description);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the best bio found for the artist name, trying sources in order.
 * Returns { bio: "", source: null } if nothing is found.
 */
export async function enrichBio(artistName: string): Promise<BioResult> {
  const [lastfm, wikipedia, google] = await Promise.all([
    fromLastfm(artistName),
    fromWikipedia(artistName),
    fromGoogleKG(artistName),
  ]);

  if (lastfm) return { bio: lastfm, source: "lastfm" };
  if (wikipedia) return { bio: wikipedia, source: "wikipedia" };
  if (google) return { bio: google, source: "google" };

  return { bio: "", source: null };
}
