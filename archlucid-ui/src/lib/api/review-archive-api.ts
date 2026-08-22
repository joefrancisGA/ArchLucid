import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type ArchiveReviewResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; status: number; message: string }>;

export async function archiveReview(runId: string): Promise<ArchiveReviewResult> {
  const encodedRunId = encodeURIComponent(runId.trim());
  const path = `/api/proxy/v1/architecture/runs/${encodedRunId}/archive`;

  const response = await fetch(
    path,
    mergeRegistrationScopeForProxy({
      method: "POST",
      headers: { Accept: "application/json" },
    }),
  );

  if (response.status === 204) {
    return { ok: true };
  }

  let message = `Could not archive review (${response.status}).`;

  try {
    const json: unknown = await response.json();

    if (json !== null && typeof json === "object") {
      const detail = (json as { detail?: unknown; title?: unknown }).detail;

      if (typeof detail === "string" && detail.trim().length > 0) {
        message = detail.trim();
      } else {
        const title = (json as { title?: unknown }).title;

        if (typeof title === "string" && title.trim().length > 0) {
          message = title.trim();
        }
      }
    }
  } catch {
    // Keep generic message when problem+json is unavailable.
  }

  return { ok: false, status: response.status, message };
}
