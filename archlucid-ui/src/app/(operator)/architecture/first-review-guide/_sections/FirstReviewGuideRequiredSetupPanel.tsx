"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { FIRST_REVIEW_GUIDE_REQUIRED_SETUP_TITLE } from "@/lib/buyer/buyer-polish-copy";
import type { FirstReviewGuideRequiredBlocker } from "@/lib/first-review-guide-state";

type FirstReviewGuideRequiredSetupPanelProps = {
  readonly blockers: readonly FirstReviewGuideRequiredBlocker[];
};

export function FirstReviewGuideRequiredSetupPanel({ blockers }: FirstReviewGuideRequiredSetupPanelProps) {
  if (blockers.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="first-review-guide-required-setup-heading"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "border border-neutral-200 p-4 dark:border-neutral-800")}
      data-testid="first-review-guide-required-setup"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="first-review-guide-required-setup-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {FIRST_REVIEW_GUIDE_REQUIRED_SETUP_TITLE}
        </h2>
        <StatusTag kind="needs-attention" label="Needs attention" />
      </div>
      <ul className="m-0 mt-3 list-none space-y-3 p-0">
        {blockers.map((blocker) => (
          <li key={blocker.id} className="space-y-1">
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {blocker.title}
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{blocker.description}</p>
            <Link href={blocker.href} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}>
              {blocker.actionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
