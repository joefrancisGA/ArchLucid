"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingDetailOperationalActionsProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly payload: FindingInspectPayload;
  readonly graphEvidenceHref: string | null;
  readonly linkedManifestHref: string | null;
  readonly inspectHref: string;
};

/** Grouped primary finding actions — navigation as links; work-item handoff as a button. */
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {props.graphEvidenceHref !== null ? (
          <Link href={props.graphEvidenceHref} className={OPERATOR_LINK.nav}>
            {BUYER_SURFACE_VOCABULARY.evidenceGraphNav}
          </Link>
        ) : null}
        {props.linkedManifestHref !== null ? (
          <Link href={props.linkedManifestHref} className={OPERATOR_LINK.nav}>
            {`Open ${SIGNED_MANIFEST_LABEL.toLowerCase()}`}
          </Link>
        ) : null}
        <Link href={props.inspectHref} className={OPERATOR_LINK.nav}>
          Open evidence trace
        </Link>
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
