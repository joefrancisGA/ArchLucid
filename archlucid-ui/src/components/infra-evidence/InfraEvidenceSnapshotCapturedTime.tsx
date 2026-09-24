import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import {
  formatInfraEvidenceSnapshotCapturedTimeTitle,
  formatInfraEvidenceSnapshotCapturedUtcLabel,
  resolveInfraEvidenceSnapshotCapturedTimeIso,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-captured-time";
import { formatInfraEvidenceSnapshotCapturedLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { cn } from "@/lib/utils";

export function InfraEvidenceSnapshotCapturedTime(props: {
  readonly capturedUtc: string | null | undefined;
  readonly className?: string;
  readonly testId?: string;
}): React.JSX.Element {
  const isoUtc = resolveInfraEvidenceSnapshotCapturedTimeIso(props.capturedUtc);
  const localLabel = formatInfraEvidenceSnapshotCapturedLabel(props.capturedUtc, DEFAULT_IANA_TIME_ZONE_ID);
  const utcLabel = formatInfraEvidenceSnapshotCapturedUtcLabel(props.capturedUtc);
  const parsedUtcMs = isoUtc == null ? Number.NaN : parseIsoUtcMs(isoUtc);
  const dateTimeAttribute = Number.isFinite(parsedUtcMs) ? new Date(parsedUtcMs).toISOString() : isoUtc;

  if (isoUtc == null || utcLabel == null) {
    return (
      <span className={cn(props.className, OPERATOR_TYPOGRAPHY.helper)} data-testid={props.testId}>
        {localLabel}
      </span>
    );
  }

  return (
    <time
      dateTime={dateTimeAttribute ?? undefined}
      title={formatInfraEvidenceSnapshotCapturedTimeTitle(props.capturedUtc)}
      className={cn(props.className, OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
    >
      {localLabel}
      <span className="text-al-text-secondary"> · {utcLabel}</span>
    </time>
  );
}
