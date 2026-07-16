import type { ReportProblemSubmitPayload } from "@/components/support/ReportProblemDialog";

/** Thrown when intake API is not yet wired (TB-788). */
export class ReportProblemIntakeUnavailableError extends Error {
  constructor() {
    super("Report problem intake API is not available yet.");

    this.name = "ReportProblemIntakeUnavailableError";
  }
}

/** TB-788 replaces with `POST /v1/support/problem-reports`. */
export async function submitReportProblemIntake(
  _payload: ReportProblemSubmitPayload,
): Promise<{ referenceId: string }> {
  throw new ReportProblemIntakeUnavailableError();
}
