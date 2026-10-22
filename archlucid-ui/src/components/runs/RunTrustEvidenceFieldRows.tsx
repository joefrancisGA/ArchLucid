import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { trustEvidenceStatusTag } from "@/lib/trust-evidence-status-tag";

export function RunTrustEvidenceFieldRow(props: {
  readonly title: string;
  readonly status: string;
  readonly detail?: string | null;
}): ReactElement {
  const { title, status, detail } = props;
  const tag = trustEvidenceStatusTag(status);

  return (
    <div className="rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className={cn("font-medium text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>{title}</div>
        <StatusTag kind={tag.kind} label={tag.label} />
      </div>
      {detail ? (
        <p className={cn("m-0 mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{detail}</p>
      ) : null}
    </div>
  );
}
