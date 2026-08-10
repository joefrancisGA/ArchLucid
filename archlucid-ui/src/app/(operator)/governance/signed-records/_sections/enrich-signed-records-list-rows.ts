import { getManifestSummary } from "@/lib/api";
import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { coerceManifestSummary } from "@/lib/operator-response-guards";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import type { SignedRecordsListRow } from "./signed-records-list-row";
import { SIGNED_RECORDS_LIST_VERSION_UNKNOWN } from "./signed-records-list-copy";

async function enrichSignedRecordsListRow(row: SignedRecordsListRow): Promise<SignedRecordsListRow> {
  const existingManifestId = row.manifestId?.trim() ?? "";
  const manifestId =
    existingManifestId.length > 0
      ? existingManifestId
      : await resolveGoldenManifestIdForRun(row.runId);

  if (manifestId === null || manifestId.length === 0) {
    return row;
  }

  let manifestVersion = SIGNED_RECORDS_LIST_VERSION_UNKNOWN;
  let committedUtc = row.committedUtc;

  try {
    const rawSummary: unknown = await getManifestSummary(manifestId);
    const coercedSummary = coerceManifestSummary(rawSummary);

    if (coercedSummary.ok) {
      const version = coercedSummary.value.ruleSetVersion?.trim() ?? "";

      if (version.length > 0) {
        manifestVersion = version;
      }

      const summaryCreatedUtc = coercedSummary.value.createdUtc?.trim() ?? "";

      if (summaryCreatedUtc.length > 0) {
        committedUtc = summaryCreatedUtc;
      }
    }
  } catch {
    // Keep run-level committed date and unknown version when manifest summary is unavailable.
  }

  return {
    ...row,
    manifestId,
    manifestVersion,
    committedUtc,
    signedRecordHref: signedRecordDetailPath(manifestId),
  };
}

/** Loads manifest ids and summary metadata for signed-record list rows. */
export async function enrichSignedRecordsListRows(
  rows: readonly SignedRecordsListRow[],
): Promise<SignedRecordsListRow[]> {
  return Promise.all(rows.map((row) => enrichSignedRecordsListRow(row)));
}
