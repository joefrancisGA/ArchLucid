import { VISIO_VSDX_CONTEXT_DOCUMENT_CONTENT_TYPE } from "@/lib/architecture-spine/supported-context-document-content-types";

const VSDX_INTAKE_FILE_EXTENSIONS = [".vsdx"] as const;

export { VISIO_VSDX_CONTEXT_DOCUMENT_CONTENT_TYPE };

/** True when the attachment is a Visio Open Packaging file the intake wizard should keep. */
export function isVsdxIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return VSDX_INTAKE_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

/** Legacy binary Visio files remain unsupported on the authority path (AS-010). */
export function isLegacyVsdIntakeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();

  return lower.endsWith(".vsd") && !lower.endsWith(".vsdx");
}

export async function encodeVsdxPackageAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary);
}
