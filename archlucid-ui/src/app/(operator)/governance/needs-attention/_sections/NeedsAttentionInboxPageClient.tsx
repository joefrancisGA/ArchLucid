"use client";

import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useAttentionPartitionPreviews } from "@/hooks/use-attention-partition-previews";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH } from "@/lib/governance/governance-route-paths";
import {
  OPERATOR_ATTENTION_KIND_DESTINATIONS,
} from "@/lib/operator/operator-attention-kind-destinations";
import {
  OPERATOR_ATTENTION_KIND_LABELS,
} from "@/lib/operator/operator-attention-taxonomy";
import { cn } from "@/lib/utils";
import { NEEDS_ATTENTION_INBOX_LABEL } from "@/lib/usability/usability-consolidation";

export function NeedsAttentionInboxPageClient(): React.JSX.Element {
  const { summaries } = useOperatorAttentionSummary();
  const previews = useAttentionPartitionPreviews();

  return (
    <OperatorPageContainer variant="full">
      <OperatorPageHeader
        navHref={GOVERNANCE_NEEDS_ATTENTION_INBOX_PATH}
        title={NEEDS_ATTENTION_INBOX_LABEL}
        subtitle="One inbox for unfinished work, assigned findings, alerts, and approvals."
      />
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2" data-testid="needs-attention-inbox-list">
        {summaries.map((summary) => {
          const destination = OPERATOR_ATTENTION_KIND_DESTINATIONS[summary.partition];
          const preview = previews[summary.partition];

          return (
            <li key={summary.partition}>
              <Link
                href={destination.href}
                className={cn(
                  "block rounded-lg border border-neutral-200 p-4 no-underline transition-colors hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900",
                  OPERATOR_LINK,
                )}
                data-testid={`needs-attention-inbox-${summary.partition}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                      {OPERATOR_ATTENTION_KIND_LABELS[summary.partition]}
                    </h2>
                    <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {destination.description}
                    </p>
                    {preview !== null && preview.length > 0 ? (
                      <p
                        className={cn("m-0 mt-2 truncate font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
                        data-testid={`needs-attention-inbox-preview-${summary.partition}`}
                      >
                        Next: {preview}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-w-[2rem] shrink-0 items-center justify-center rounded-full bg-neutral-200 px-2 py-0.5 text-sm font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                    aria-label={`${summary.totalCount} items`}
                  >
                    {summary.totalCount}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </OperatorPageContainer>
  );
}
