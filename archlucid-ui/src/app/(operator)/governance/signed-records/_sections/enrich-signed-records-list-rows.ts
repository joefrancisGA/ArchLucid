import { resolveGoldenManifestIdForRun } from "@/lib/resolve-golden-manifest-id-for-run";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

import type { SignedRecordsListRow } from "./signed-records-list-row";

async function enrichSignedRecordsListRow(row: SignedRecordsListRow): Promise<SignedRecordsListRow> {
  const existingManifestId = row.manifestId?.trim() ?? "";

  if (existingManifestId.length > 0) {
    return row;
  }

  const manifestId = await resolveGoldenManifestIdForRun(row.runId);

  if (manifestId === null || manifestId.length === 0) {
    return row;
  }

  return {
    ...row,
    manifestId,
    signedRecordHref: signedRecordDetailPath(manifestId),
  };
}

/** Resolves missing manifest ids for signed-record list rows (list payload already carries version). */
export async function enrichSignedRecordsListRows(
  rows: readonly SignedRecordsListRow[],
): Promise<SignedRecordsListRow[]> {
  return Promise.all(rows.map((row) => enrichSignedRecordsListRow(row)));
}
