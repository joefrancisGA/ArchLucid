import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { ensureOidcBearerReady, resolveRequest, withCorrelationHeaders } from "@/lib/api/http";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ExtractEvidenceDocumentTextSuccess = {
  readonly ok: true;
  readonly text: string;
  readonly truncated: boolean;
};

export type ExtractEvidenceDocumentTextFailure = {
  readonly ok: false;
  readonly message: string;
};

export type ExtractEvidenceDocumentTextResult =
  | ExtractEvidenceDocumentTextSuccess
  | ExtractEvidenceDocumentTextFailure;

type ExtractEvidenceDocumentTextResponse = {
  readonly text?: string;
  readonly truncated?: boolean;
};

/** Extracts advisory plain text from a PDF or DOCX via the API (no evidence persistence). */
export async function extractEvidenceDocumentText(file: File): Promise<ExtractEvidenceDocumentTextResult> {
  await ensureOidcBearerReady();

  const formData = new FormData();
  formData.append("file", file);

  const { url, headers } = await resolveRequest("/v1/architecture/evidence/extract-text");
  const response = await fetch(
    url,
    mergeRegistrationScopeForProxy({
      method: "POST",
      headers: withCorrelationHeaders(headers),
      body: formData,
    }),
  );
  const bodyText = await response.text();

  if (!response.ok) {
    const apiError = buildApiRequestErrorFromParts(response, bodyText);

    return {
      ok: false,
      message: apiError.message,
    };
  }

  try {
    const payload = JSON.parse(bodyText) as ExtractEvidenceDocumentTextResponse;
    const text = payload.text?.trim() ?? "";

    if (text.length === 0) {
      return {
        ok: false,
        message: "No extractable text was returned for this document.",
      };
    }

    return {
      ok: true,
      text,
      truncated: payload.truncated === true,
    };
  } catch {
    return {
      ok: false,
      message: "Could not parse text extraction response.",
    };
  }
}
