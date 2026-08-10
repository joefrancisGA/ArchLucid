import { cn } from "@/lib/utils";

import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildDispositionExportBeforeAfter } from "@/lib/disposition-export-before-after";

export type DispositionExportBeforeAfterPreviewProps = {
  readonly disposition: FindingDispositionKind;
  readonly findingTitle?: string | null;
  readonly currentDisposition?: FindingDispositionKind | null;
  readonly className?: string;
};

function PacketColumn(props: {
  readonly title: string;
  readonly lines: readonly string[];
  readonly testId: string;
}): React.JSX.Element {
  return (
    <div
      className="min-w-0 rounded-md border border-al-border bg-al-surface px-3 py-2"
      data-testid={props.testId}
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>{props.title}</p>
      <ul className={cn("m-0 mt-2 list-none space-y-1 p-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {props.lines.map((line) => (
          <li key={line} className="whitespace-pre-wrap break-words">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Visual before/after sponsor packet + signed-record snippet for disposition confirm (TB-2193). */
export function DispositionExportBeforeAfterPreview(
  props: DispositionExportBeforeAfterPreviewProps,
): React.JSX.Element {
  const preview = buildDispositionExportBeforeAfter({
    disposition: props.disposition,
    findingTitle: props.findingTitle,
    currentDisposition: props.currentDisposition,
  });

  return (
    <div
      className={cn(
        "space-y-2 rounded-md border border-al-border bg-al-surface-raised px-3 py-2",
        props.className,
      )}
      data-testid="disposition-export-before-after"
    >
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
        Packet preview — {preview.dispositionLabel}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <PacketColumn
          title="Before"
          lines={preview.beforeLines}
          testId="disposition-export-before-after-before"
        />
        <PacketColumn
          title="After"
          lines={preview.afterLines}
          testId="disposition-export-before-after-after"
        />
      </div>
    </div>
  );
}
