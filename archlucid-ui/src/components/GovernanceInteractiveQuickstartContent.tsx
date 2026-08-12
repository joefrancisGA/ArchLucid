"use client";

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture-routes";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  GOVERNANCE_OVERVIEW_QUICKSTART_CHECKLIST_HEADING,
  GOVERNANCE_OVERVIEW_QUICKSTART_CHECKLIST_LEAD,
} from "@/lib/governance/governance-overview-copy";

type GovernanceInteractiveQuickstartContentProps = {
  /** Hide the First 30 days onboarding link (buyer-polished workflow surface). */
  readonly hideFirst30DaysLink?: boolean;
  readonly className?: string;
};

/** First-time governance approval checklist — embeddable inside LayerHeader or cards. */
export function GovernanceInteractiveQuickstartContent({
  hideFirst30DaysLink = false,
  className,
}: GovernanceInteractiveQuickstartContentProps): React.JSX.Element {
  return (
    <div className={cn("space-y-3", className)} data-testid="governance-interactive-quickstart">
      <div>
        <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {GOVERNANCE_OVERVIEW_QUICKSTART_CHECKLIST_HEADING}
        </p>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {GOVERNANCE_OVERVIEW_QUICKSTART_CHECKLIST_LEAD}
        </p>
      </div>
      <ol className={cn("m-0 list-decimal space-y-2 pl-5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        <li>
          <Link href={GOVERNANCE_POLICY_PACKS_PATH} className="font-medium text-teal-800 underline dark:text-teal-300">
            Open policy packs
          </Link>
          {" — assign or publish the rule set that governs your scope."}
        </li>
        <li>
          <Link href="/architecture/reviews/new" className="font-medium text-teal-800 underline dark:text-teal-300">
            Run an architecture review
          </Link>
          {" — finalize so you have a review record version to submit."}
        </li>
        <li>Request governance approval, then approve and advance the review when your role allows.</li>
        <li>Record go-live by releasing the approved review record to the target environment.</li>
      </ol>
      {hideFirst30DaysLink ? null : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Onboarding preset (optional):{" "}
          <Link href="/governance/setup" className="font-medium text-teal-800 underline dark:text-teal-300">
            Governance setup
          </Link>
        </p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Button asChild size="sm" variant="secondary">
          <Link href={GOVERNANCE_POLICY_PACKS_PATH}>Policy packs</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={ARCHITECTURES_NEW_PATH}>{CREATE_ARCHITECTURE_LABEL}</Link>
        </Button>
      </div>
    </div>
  );
}
