import type { ReportProblemSubmitPayload } from "@/components/support/ReportProblemDialog";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export const SUPPORT_PROBLEM_REPORT_PATH = "/api/proxy/v1/support/problem-reports";

/** Thrown when intake API is unavailable or returns an error response. */
export class ReportProblemIntakeUnavailableError extends Error {
  constructor() {
    super("Report problem intake API is not available yet.");

    this.name = "ReportProblemIntakeUnavailableError";
  }
}

export type SubmitReportProblemIntakeResult = {
  readonly referenceId: string;
  readonly supportBundleAttached: boolean;
  readonly supportBundleAttachWarning: string | null;
};

function parseSubmitReportProblemIntakeResponse(json: unknown): SubmitReportProblemIntakeResult | null {
  if (json === null || typeof json !== "object") {
    return null;
  }

  const record = json as Record<string, unknown>;
  const referenceId = String(record.referenceId ?? "").trim();

  if (referenceId.length === 0) {
    return null;
  }

  const supportBundleAttached = record.supportBundleAttached === true;
  const warningRaw = record.supportBundleAttachWarning;
  const supportBundleAttachWarning =
    typeof warningRaw === "string" && warningRaw.trim().length > 0 ? warningRaw.trim() : null;

  return { referenceId, supportBundleAttached, supportBundleAttachWarning };
}

/** Posts structured problem-report context to `POST /v1/support/problem-reports` (TB-788). */
export async function submitReportProblemIntake(
  payload: ReportProblemSubmitPayload,
  fetchFn: typeof fetch = fetch,
): Promise<SubmitReportProblemIntakeResult> {
  try {
    const res = await fetchFn(
      SUPPORT_PROBLEM_REPORT_PATH,
      mergeRegistrationScopeForProxy({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    if (!res.ok) {
      throw new ReportProblemIntakeUnavailableError();
    }

    const json: unknown = await res.json();
    const parsed = parseSubmitReportProblemIntakeResponse(json);

    if (parsed === null) {
      throw new ReportProblemIntakeUnavailableError();
    }

    return parsed;
  } catch (error) {
    if (error instanceof ReportProblemIntakeUnavailableError) {
      throw error;
    }

    throw new ReportProblemIntakeUnavailableError();
  }
}
