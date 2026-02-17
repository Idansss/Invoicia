import { renderToBuffer } from "@react-pdf/renderer";

import { saveBlob } from "@/server/storage/local";

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
  const { storagePath } = await saveBlob({
    dir: params.subdir,
    filename: params.filename,
    bytes: params.bytes,
    contentType: "application/pdf",
  });
  return { storagePath };
}
