import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function formatSignedRecordArtifactGeneratedTimestamp(isoUtc: string): {
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

export type SignedRecordArtifactGeneratedTimestampProps = {
  readonly createdUtc: string;
};

/** Generated timestamp with machine-readable `<time>` for artifact metadata. */
export function SignedRecordArtifactGeneratedTimestamp(
  props: SignedRecordArtifactGeneratedTimestampProps,
): React.JSX.Element {
  const formatted = formatSignedRecordArtifactGeneratedTimestamp(props.createdUtc);

  if (formatted === null) {
    return <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{props.createdUtc}</span>;
  }

  return (
    <time
      dateTime={formatted.dateTime}
      title={formatted.dateTime}
      className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      data-testid="signed-record-artifact-generated-timestamp"
    >
      {formatted.display}
    </time>
  );
}
