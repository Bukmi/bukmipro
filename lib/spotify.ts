/**
 * Spotify Web API helpers — Client Credentials flow (server-side only).
 * No user OAuth needed; reads public artist data.
 */

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// ---------------------------------------------------------------------------
// Token cache (in-memory, per serverless instance)
// ---------------------------------------------------------------------------
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not configured");
  }

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    // Don't cache at the fetch layer — we manage it ourselves
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return cachedToken.value;
}

// ---------------------------------------------------------------------------
// URL / ID parsing
// ---------------------------------------------------------------------------

/**
 * Extracts the Spotify artist ID from any Spotify URL format.
 * Accepts:
 *   https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb
 *   https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb?si=...
 *   spotify:artist:4Z8W4fKeB5YxbusRsdQVPb
 *   4Z8W4fKeB5YxbusRsdQVPb  (raw ID)
 */
export function parseSpotifyArtistId(input: string): string | null {
  const trimmed = input.trim();

  // URI form: spotify:artist:<id>
  const uriMatch = trimmed.match(/^spotify:artist:([A-Za-z0-9]+)/);
  if (uriMatch) return uriMatch[1];

  // URL form: open.spotify.com/artist/<id>
  const urlMatch = trimmed.match(/open\.spotify\.com\/artist\/([A-Za-z0-9]+)/);
  if (urlMatch) return urlMatch[1];

  // Raw ID (22 alphanumeric chars)
  if (/^[A-Za-z0-9]{22}$/.test(trimmed)) return trimmed;

  return null;
}

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  followers: number;
  popularity: number; // 0-100
  images: { url: string; width: number; height: number }[];
  topTrackId: string | null;
  topTrackName: string | null;
  externalUrl: string;
};

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function spotifyGet<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 }, // cache for 1 hour in Next.js data cache
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

type SpotifyArtistRaw = {
  id: string;
  name: string;
  genres: string[];
  followers: { total: number };
  popularity: number;
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
};

type SpotifyTopTracksRaw = {
  tracks: { id: string; name: string }[];
};

/**
 * Fetches full artist data + top track from Spotify.
 * Returns null if the artist ID is invalid (404).
 */
export async function fetchSpotifyArtist(
  artistId: string
): Promise<SpotifyArtist | null> {
  try {
    const [artist, topTracks] = await Promise.all([
      spotifyGet<SpotifyArtistRaw>(`/artists/${artistId}`),
      spotifyGet<SpotifyTopTracksRaw>(`/artists/${artistId}/top-tracks?market=ES`),
    ]);

    const topTrack = topTracks.tracks[0] ?? null;

    return {
      id: artist.id,
      name: artist.name,
      genres: artist.genres ?? [],
      followers: artist.followers.total,
      popularity: artist.popularity,
      images: artist.images ?? [],
      topTrackId: topTrack?.id ?? null,
      topTrackName: topTrack?.name ?? null,
      externalUrl: artist.external_urls.spotify,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}
