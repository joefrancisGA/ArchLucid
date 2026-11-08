import {
  extractArchitectureIdentityIdFromPathname,
  readCachedLastOpenArchitectureId,
} from "@/lib/desk-continuity-preference";
import { readRecentPrimaryReviewDeskTarget } from "@/lib/reviews/review-pin-run-url";

export type ResolveGlobalSearchDeskArchitectureIdInput = {
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly pathname?: string | null;
  readonly search?: string | null;
};

/** IP-003 — global search navigation reuses desk continuity when wire payloads omit architectureId. */
export function resolveGlobalSearchDeskArchitectureId(
  input: ResolveGlobalSearchDeskArchitectureIdInput,
): string | null {
  const explicitArchitectureId = input.architectureId?.trim() ?? "";

  if (explicitArchitectureId.length > 0) {
    return explicitArchitectureId;
  }

  const fromPath = extractArchitectureIdentityIdFromPathname(input.pathname ?? "", input.search ?? "");

  if (fromPath !== null) {
    return fromPath;
  }

  const trimmedRunId = input.runId.trim();
  const recent = readRecentPrimaryReviewDeskTarget();

  if (recent !== null && recent.primaryRunId === trimmedRunId && recent.architectureId !== null) {
    return recent.architectureId;
  }

  return readCachedLastOpenArchitectureId();
}
