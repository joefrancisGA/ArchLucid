import { cn } from "@/lib/utils";

import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  dispositionExportImpactSurfaceLabel,
  getDispositionExportImpactLines,
} from "@/lib/disposition-export-impact";

export type DispositionExportImpactNoticeProps = {
  readonly disposition: FindingDispositionKind;
  readonly className?: string;
};

/** Confirmation-dialog copy for signed-record vs sponsor-packet disposition consequences (TB-2184). */
export function DispositionExportImpactNotice(props: DispositionExportImpactNoticeProps): React.JSX.Element {
  const lines = getDispositionExportImpactLines(props.disposition);

  return (
    <div
      className={cn(
        "space-y-2 rounded-md border border-al-border bg-al-surface-raised px-3 py-2 text-al-text-secondary",
        OPERATOR_TYPOGRAPHY.helper,
        props.className,
      )}
      data-testid={`disposition-export-impact-notice-${props.disposition}`}
    >
      <p className="m-0 font-medium text-al-text-primary">Export impact</p>
      <ul className="m-0 list-disc space-y-1 pl-5">
        {lines.map((line) => (
          <li key={line.surface} data-testid={`disposition-export-impact-${line.surface}`}>
            <span className="font-medium text-al-text-primary">
              {dispositionExportImpactSurfaceLabel(line.surface)}:
            </span>{" "}
            {line.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
