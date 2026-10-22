import {
  isSignedRecordsListRowOpenable,
  type SignedRecordsListRow,
} from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";

export type ManifestDetailNextRecordTarget = {
  readonly manifestId: string;
  readonly reviewTitle: string;
  readonly href: string;
};

/** Next openable sealed record in list order after the current manifest id. */
export function resolveNextSignedRecordsListRow(
  rows: readonly SignedRecordsListRow[],
  currentManifestId: string,
): ManifestDetailNextRecordTarget | null {
  const normalizedCurrentId = currentManifestId.trim();
  const openableRows = rows.filter((row) => isSignedRecordsListRowOpenable(row) && row.manifestId !== null);
  const currentIndex = openableRows.findIndex((row) => row.manifestId === normalizedCurrentId);

  if (currentIndex < 0) {
    return null;
  }

  const nextRow = openableRows[currentIndex + 1];

  if (nextRow === undefined || nextRow.manifestId === null || nextRow.signedRecordHref === null) {
    return null;
  }

  return {
    manifestId: nextRow.manifestId,
    reviewTitle: nextRow.reviewTitle,
    href: nextRow.signedRecordHref,
  };
}
