import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { SignedRecordsListEmptyValue } from "./signed-records-list-empty-value";
import { SIGNED_RECORDS_LIST_VERSION_UNKNOWN } from "./signed-records-list-copy";

export function formatSignedRecordsListSealedTimestamp(isoUtc: string): {
  readonly display: string;
  readonly dateTime: string;
} | null {
  const trimmed = isoUtc.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return null;
  }

  const date = new Date(parsed);

  return {
    dateTime: date.toISOString(),
    display: date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }),
  };
}

export type SignedRecordsListSealedTimestampProps = {
  readonly committedUtc: string;
};

/** Seal timestamp with machine-readable `<time>` — list column uses manifest `createdUtc`, not review start. */
export function SignedRecordsListSealedTimestamp(props: SignedRecordsListSealedTimestampProps): React.JSX.Element {
  const formatted = formatSignedRecordsListSealedTimestamp(props.committedUtc);

  if (formatted === null) {
    return <SignedRecordsListEmptyValue fieldLabel="Finalized date" />;
  }

  return (
    <time
      dateTime={formatted.dateTime}
      className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
    >
      {formatted.display}
    </time>
  );
}
