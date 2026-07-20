"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { Button } from "@/components/ui/button";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingDetailOperationalActionsProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly payload: FindingInspectPayload;
  readonly graphEvidenceHref: string | null;
  readonly linkedManifestHref: string | null;
  readonly inspectHref: string;
};

/** Grouped primary finding actions — evidence, decision, and work-item handoff. */
export function FindingDetailOperationalActions(props: FindingDetailOperationalActionsProps): React.JSX.Element {
  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="finding-detail-operational-actions"
      aria-label="Finding actions"
    >
      <p className={cn("m-0 mb-2 font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Actions
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {props.graphEvidenceHref !== null ? (
          <Button type="button" asChild variant="default" size="sm">
            <Link href={props.graphEvidenceHref}>{BUYER_SURFACE_VOCABULARY.evidenceGraphNav}</Link>
          </Button>
        ) : null}
        {props.linkedManifestHref !== null ? (
          <Button type="button" asChild variant="outline" size="sm">
            <Link href={props.linkedManifestHref}>Open signed decision</Link>
          </Button>
        ) : null}
        <Button type="button" asChild variant="outline" size="sm">
          <Link href={props.inspectHref}>Open evidence trace</Link>
        </Button>
        <CopyFindingAsWorkItemButton
          runId={props.runId}
          findingId={props.findingId}
          payload={props.payload}
          compact
        />
      </div>
    </section>
  );
}
