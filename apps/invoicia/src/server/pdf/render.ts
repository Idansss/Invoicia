import fs from "node:fs/promises";
import path from "node:path";

import { renderToBuffer } from "@react-pdf/renderer";

import { env } from "@/server/env";

export async function renderPdfToBuffer(doc: React.ReactElement) {
  // renderToBuffer returns a Node.js Buffer in Node runtimes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buf = await renderToBuffer(doc as any);
  return Buffer.from(buf);
}

export async function writeArtifact(params: {
  subdir: string;
  filename: string;
  bytes: Buffer;
}) {
  const fullDir = path.join(env.STORAGE_DIR, params.subdir);
  await fs.mkdir(fullDir, { recursive: true });
  const storagePath = path.join(fullDir, params.filename);
  await fs.writeFile(storagePath, params.bytes);
  return { storagePath };
}
