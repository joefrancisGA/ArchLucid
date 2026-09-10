import {
  applyCorrelationHeaders,
  ensureOidcBearerReady,
  isBrowser,
  throwApiRequestError,
} from "@/lib/api/http";
import { captureTraceContextFromResponse } from "@/lib/correlation";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (header === null) {
    return null;
  }

  const match = /filename="([^"]+)"/i.exec(header);

  if (match === null || match[1] === undefined) {
    return null;
  }

  return match[1];
}

/** Browser-only authenticated download for customer-tier help PDFs (TB-726). */
export async function downloadHelpTopicPdf(slug: string): Promise<void> {
  if (!isBrowser()) {
    throw new Error("downloadHelpTopicPdf is only supported in the browser.");
  }

  await ensureOidcBearerReady();

  const headers = new Headers({ Accept: "application/pdf, application/json" });

  const init = mergeRegistrationScopeForProxy({
    method: "GET",
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const { headers: requestHeaders, correlationId } = applyCorrelationHeaders(new Headers(init.headers));
  const response = await fetch(`/api/help/${encodeURIComponent(slug)}/pdf`, {
    ...init,
    headers: requestHeaders,
    method: "GET",
  });
  captureTraceContextFromResponse(response);

  if (!response.ok) {
    const errText = await response.text();
    throwApiRequestError(response, errText, correlationId);
  }

  const fileName =
    parseFilenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `${slug}.pdf`;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
