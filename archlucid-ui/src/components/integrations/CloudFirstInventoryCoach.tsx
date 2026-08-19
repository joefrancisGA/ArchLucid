"use client";

import Link from "next/link";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildCloudFirstInventoryCoach,
  type CloudFirstInventoryCoachInput,
} from "@/lib/cloud-first-inventory-coach";
import { cn } from "@/lib/utils";

export type CloudFirstInventoryCoachProps = CloudFirstInventoryCoachInput & {
  readonly className?: string;
};

/**
 * Post-connect coach: attach inventory then start a review (TB-2222).
 * Prefer this over idle "no collection activity" empty copy.
 */
export function CloudFirstInventoryCoach(props: CloudFirstInventoryCoachProps): ReactElement {
  const view = buildCloudFirstInventoryCoach({
    hasConnection: props.hasConnection,
    hasSuccessfulPull: props.hasSuccessfulPull,
    connectedProviderCount: props.connectedProviderCount,
    totalProviderCount: props.totalProviderCount,
    recommendedProviderId: props.recommendedProviderId,
    emptyPhasePrimaryCtaHref: props.emptyPhasePrimaryCtaHref,
  });

  return (
    <aside
      className={cn(
        "rounded-md border border-teal-700/25 bg-teal-50/40 px-3 py-3 dark:border-teal-600/30 dark:bg-teal-950/20",
        props.className,
      )}
      data-testid="cloud-first-inventory-coach"
      data-phase={view.phase}
      aria-labelledby="cloud-first-inventory-coach-title"
    >
      <h3
        id="cloud-first-inventory-coach-title"
        className={cn(
          "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {view.title}
      </h3>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{view.body}</p>
      {view.steps.length > 0 ? (
        <ol className={cn("m-0 mt-2 list-decimal space-y-1 pl-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {view.steps.map((step) => (
            <li key={step.id} data-testid={`cloud-first-inventory-coach-step-${step.id}`}>
              {step.label}
            </li>
          ))}
        </ol>
      ) : null}
      <div className="mt-3">
        <Button type="button" variant="primary" size="sm" asChild>
          <Link href={view.primaryCtaHref} data-testid="cloud-first-inventory-coach-cta">
            {view.primaryCtaLabel}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
