import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Storage adapter. En dev escribe a public/uploads/.
// Sprint 4 reemplaza saveFile con un cliente S3/R2.

export type SavedFile = {
  url: string;
  sizeBytes: number;
  mimeType: string;
};

const ALLOWED_IMAGE = /^image\/(png|jpe?g|webp|avif)$/;
const ALLOWED_VIDEO = /^video\/(mp4|webm)$/;
const ALLOWED_AUDIO = /^audio\/(mpeg|mp3|wav|webm|ogg)$/;
const ALLOWED_DOC = /^application\/(pdf)$/;

export type FileCategory = "image" | "video" | "audio" | "document";

const MAX_BYTES: Record<FileCategory, number> = {
  image: 8 * 1024 * 1024,
  video: 120 * 1024 * 1024,
  audio: 40 * 1024 * 1024,
  document: 15 * 1024 * 1024,
};

export function categorise(mime: string): FileCategory | null {
  if (ALLOWED_IMAGE.test(mime)) return "image";
  if (ALLOWED_VIDEO.test(mime)) return "video";
  if (ALLOWED_AUDIO.test(mime)) return "audio";
  if (ALLOWED_DOC.test(mime)) return "document";
  return null;
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/avif": "avif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/webm": "weba",
    "audio/ogg": "ogg",
    "application/pdf": "pdf",
  };
  return map[mime] ?? "bin";
}

export async function saveFile(
  file: File,
  namespace: string // p.ej. `artist/${artistId}/media`
): Promise<SavedFile> {
  const category = categorise(file.type);
  if (!category) {
    throw new StorageError("Tipo de archivo no permitido.");
  }
  if (file.size > MAX_BYTES[category]) {
    const mb = Math.round(MAX_BYTES[category] / 1024 / 1024);
    throw new StorageError(`Archivo demasiado grande. Máximo ${mb} MB.`);
  }

  const id = randomBytes(8).toString("hex");
  const ext = extFromMime(file.type);
  const filename = `${Date.now()}-${id}.${ext}`;
  const relDir = path.posix.join("uploads", namespace);
  const absDir = path.join(process.cwd(), "public", relDir);
  await mkdir(absDir, { recursive: true });
  const absPath = path.join(absDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buffer);

  return {
    url: `/${relDir}/${filename}`,
    sizeBytes: buffer.length,
    mimeType: file.type,
  };
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}
