import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CROSS_LINK_HELPER,
  RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL,
} from "@/lib/runs/run-detail-create-home-evidence-copy";
import { buildRunDetailCreateHomeEvidenceDiagramHref } from "@/lib/runs/run-detail-create-home-evidence-diagram-href";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailCreateHomeEvidenceDiagramCrossLinkProps = {
  readonly runId: string;
};

/** TB-1848 — Evidence tab secondary path to the illustrative Diagram archTab. */
export function RunDetailCreateHomeEvidenceDiagramCrossLink(
  props: RunDetailCreateHomeEvidenceDiagramCrossLinkProps,
): ReactElement {
  const diagramHref = buildRunDetailCreateHomeEvidenceDiagramHref(props.runId);

  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-al-surface-raised p-3 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800"
      data-testid="run-detail-create-home-evidence-diagram-cross-link"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CROSS_LINK_HELPER}
      </p>
      <Button type="button" variant="outline" size="sm" className="shrink-0" asChild>
        <Link href={diagramHref}>{RUN_DETAIL_CREATE_HOME_EVIDENCE_DIAGRAM_CTA_LABEL}</Link>
      </Button>
    </div>
  );
}
