"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import { cn } from "@/lib/utils";
import type { PolicyPack } from "@/types/policy-packs";

export type PolicyPacksContinueLastViewedRowProps = {
  readonly pack: PolicyPack;
};

/** Pinned continue row for the most recently viewed policy pack. */
export function PolicyPacksContinueLastViewedRow(
  props: PolicyPacksContinueLastViewedRowProps,
): React.JSX.Element {
  const href = policyPacksEditHref(props.pack.policyPackId);

  return (
    <section
      aria-labelledby="policy-packs-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="policy-packs-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="policy-packs-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed pack
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.pack.name}</span>
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="policy-packs-continue-last-viewed-open">
          <Link href={href}>Open pack</Link>
        </Button>
      </div>
    </section>
  );
}
