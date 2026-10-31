import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

import { MetadataStatusLabel } from "@/components/ui/metadata-status-label";
import {
  normalizeFindingSeverity,
  SEVERITY_LABELS,
  severityTagClass,
  type FindingSeverityKind,
} from "@/lib/design-tokens";

export type SeverityTagProps = {
  /** Raw severity from API; normalized before display. */
  severity: string | null | undefined;
  kind?: FindingSeverityKind;
  label?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

/** Finding severity metadata label aligned with enterprise token palette. */
export function SeverityTag({
  severity,
  kind,
  label,
  className,
  ...rest
}: SeverityTagProps): React.ReactElement {
  const trimmedLabel = label?.trim() ?? "";
  const rawSeverityMissing =
    severity === null ||
    severity === undefined ||
    (typeof severity === "string" && severity.trim().length === 0);
  const resolved =
    kind ?? (rawSeverityMissing ? "unknown" : normalizeFindingSeverity(severity));
  const display = (
    trimmedLabel.length > 0
      ? trimmedLabel
      : rawSeverityMissing
        ? "Severity was not stored."
        : resolved === "unknown"
          ? (severity?.trim().length ?? 0) > 0
            ? `Severity ${severity?.trim()} has no reviewer label.`
            : SEVERITY_LABELS.unknown
          : SEVERITY_LABELS[resolved]
  ).trim();

  return (
    <MetadataStatusLabel
      className={cn(severityTagClass(resolved), className)}
      aria-label={`Severity: ${display}`}
      {...rest}
    >
      {display}
    </MetadataStatusLabel>
  );
}
