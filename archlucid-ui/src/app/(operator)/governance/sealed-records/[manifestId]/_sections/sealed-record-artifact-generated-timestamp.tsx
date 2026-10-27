import { formatArtifactCreatedUtcForDisplay } from "@/lib/artifacts/format-artifact-created-utc-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SealedRecordArtifactGeneratedTimestampProps = {
  readonly createdUtc: string | null | undefined;
  readonly className?: string;
};

/** Sealed-record deliverables row — generated time with explicit omission copy. */
export function SealedRecordArtifactGeneratedTimestamp(
  props: SealedRecordArtifactGeneratedTimestampProps,
): React.JSX.Element {
  return (
    <span
      className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid="sealed-record-artifact-generated-timestamp"
    >
      {formatArtifactCreatedUtcForDisplay(props.createdUtc)}
    </span>
  );
}
