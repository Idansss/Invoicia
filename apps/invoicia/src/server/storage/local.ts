import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { del, put } from "@vercel/blob";

import { env } from "@/server/env";

function isRemoteStoragePath(storagePath: string) {
  return storagePath.startsWith("http://") || storagePath.startsWith("https://");
}

function safeDir(input: string) {
  return input
    .replaceAll("..", "_")
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .join("/");
}

function safeFilename(filename: string) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext).replaceAll(/[^a-zA-Z0-9-_]+/g, "_");
  const unique = crypto.randomBytes(8).toString("hex");
  return `${base}-${unique}${ext || ""}`;
}

function isBlobStorageEnabled() {
  return env.STORAGE_BACKEND === "vercel-blob" || Boolean(env.BLOB_READ_WRITE_TOKEN);
}

function requireBlobToken() {
  if (env.BLOB_READ_WRITE_TOKEN) return env.BLOB_READ_WRITE_TOKEN;
  throw new Error("BLOB_READ_WRITE_TOKEN is required when STORAGE_BACKEND=vercel-blob.");
}

export async function ensureStorageDir() {
  if (isBlobStorageEnabled()) return;
  await fs.mkdir(env.STORAGE_DIR, { recursive: true });
}

export async function saveBlob(params: {
  dir: string;
  filename: string;
  bytes: Uint8Array | Buffer;
  contentType?: string;
}) {
  const cleanDir = safeDir(params.dir);
  const storedName = safeFilename(params.filename);

  if (isBlobStorageEnabled()) {
    const token = requireBlobToken();
    const pathname = `${cleanDir}/${storedName}`;
    const uploaded = await put(pathname, Buffer.from(params.bytes), {
      access: "public",
      token,
      contentType: params.contentType,
      addRandomSuffix: false,
    });
    return { storagePath: uploaded.url };
  }

  await ensureStorageDir();
  const fullDir = path.join(env.STORAGE_DIR, cleanDir);
  await fs.mkdir(fullDir, { recursive: true });
  const storagePath = path.join(fullDir, storedName);
  await fs.writeFile(storagePath, params.bytes);
  return { storagePath };
}

export async function readBlob(storagePath: string) {
  if (isRemoteStoragePath(storagePath)) {
    const response = await fetch(storagePath, { cache: "no-store" });
    if (!response.ok) throw new Error("Storage object not found.");
    const bytes = Buffer.from(await response.arrayBuffer());
    return { bytes, contentType: response.headers.get("content-type") };
  }

  const bytes = await fs.readFile(storagePath);
  return { bytes, contentType: null as string | null };
}

export async function deleteBlob(storagePath: string) {
  if (!storagePath) return;

  if (isRemoteStoragePath(storagePath)) {
    if (!isBlobStorageEnabled()) return;
    const token = requireBlobToken();
    await del(storagePath, { token }).catch(() => undefined);
    return;
  }

  await fs.unlink(storagePath).catch(() => undefined);
}
