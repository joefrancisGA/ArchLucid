import { captureTraceContextFromResponse } from "@/lib/correlation";
import { applyCorrelationHeaders } from "./http";

export async function fetchBrowserDownload(
  url: string,
  init: RequestInit,
): Promise<{ response: Response; correlationId: string }> {
  const { headers, correlationId } = applyCorrelationHeaders(new Headers(init.headers));
  const response = await fetch(url, { ...init, headers });
  captureTraceContextFromResponse(response);

  return { response, correlationId };
}

export function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const quotedFilename = /filename\s*=\s*"([^"]+)"/i.exec(header);

  if (quotedFilename?.[1]) {
    return quotedFilename[1].trim();
  }

  const starFilename = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);

  if (starFilename?.[1]) {
  const encoded = starFilename[1].trim();

  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
  }

  const legacyMatch = /filename\s*=\s*([^;]+)/i.exec(header);

  return legacyMatch?.[1]?.replace(/"/g, "").trim() ?? null;
}

export async function triggerBrowserBlobDownload(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
