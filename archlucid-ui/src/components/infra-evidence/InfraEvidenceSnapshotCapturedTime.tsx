"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import {
  formatInfraEvidenceSnapshotCapturedTimeTitle,
  formatInfraEvidenceSnapshotCapturedUtcLabel,
  resolveInfraEvidenceSnapshotCapturedTimeIso,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-captured-time";
import { formatInfraEvidenceSnapshotCapturedLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { useIanaTimeZonePreference } from "@/lib/use-iana-time-zone-preference";
import { cn } from "@/lib/utils";

export function InfraEvidenceSnapshotCapturedTime(props: {
  readonly capturedUtc: string | null | undefined;
  readonly className?: string;
  readonly testId?: string;
}): React.JSX.Element {
  const { ianaTimeZoneId } = useIanaTimeZonePreference();
  const isoUtc = resolveInfraEvidenceSnapshotCapturedTimeIso(props.capturedUtc);
  const localLabel = formatInfraEvidenceSnapshotCapturedLabel(props.capturedUtc, ianaTimeZoneId);
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
      title={formatInfraEvidenceSnapshotCapturedTimeTitle(props.capturedUtc, ianaTimeZoneId)}
      className={cn(props.className, OPERATOR_TYPOGRAPHY.helper)}
      data-testid={props.testId}
    >
      {localLabel}
      <span className="text-al-text-secondary"> · {utcLabel}</span>
    </time>
  );
}
