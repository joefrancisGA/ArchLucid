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
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(header);

  return m?.[1]?.replace(/"/g, "").trim() ?? null;
}

export async function triggerBrowserBlobDownload(blob: Blob, fileName: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
