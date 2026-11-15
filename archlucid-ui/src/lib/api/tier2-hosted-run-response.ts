import { nonNegativeFiniteOrDefault, requireRecord, trimOptionalText } from "./api-boundary-normalization";

/** Result shared by the Azure, AWS, and GCP hosted Tier 2 extractor runs. */
export interface Tier2HostedRunResult {
  packageId: string;
  resourceCount: number;
}

/**
 * Maps a hosted-run response to safe values.
 * A non-object response throws; a missing package id becomes "" and a malformed count becomes 0.
 */
export function toTier2HostedRunResult(raw: unknown): Tier2HostedRunResult {
  const row = requireRecord<Record<string, unknown>>(raw, "Hosted extractor run");

  return {
    packageId: typeof row.packageId === "string" ? row.packageId.trim() : "",
    resourceCount: nonNegativeFiniteOrDefault(row.resourceCount),
  };
}

/** Returns the optional run id only when it has text, so a blank value is not sent as an invalid GUID. */
export function optionalHostedRunId(runId: string | undefined): { runId?: string } {
  const trimmed = trimOptionalText(runId);

  return trimmed === undefined ? {} : { runId: trimmed };
}
