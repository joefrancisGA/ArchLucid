import { StandardsRulesPolicyPackReference } from "@/app/(operator)/governance/standards-and-rules/_sections/StandardsRulesPolicyPackReference";

import type { StandardsRulesReviewContextModel } from "@/lib/governance/governance-resolution-page-presentation";

import { STANDARDS_RULES_RESOLUTION_DISCLOSURE_SUMMARY } from "@/lib/standards-rules-page";

import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { cn } from "@/lib/utils";



export type StandardsRulesReviewContextRowProps = {

  readonly context: StandardsRulesReviewContextModel;

};



export function StandardsRulesReviewContextRow(props: StandardsRulesReviewContextRowProps) {

  const { context } = props;

  const packCount = context.contributingPolicyPacks.length;

  const packScopeLabel =

    packCount === 1 ? "Source policy pack" : `Policy packs in scope (${packCount})`;



  return (

    <section

      className="mb-4 rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"

      data-testid="standards-rules-review-context-row"

      aria-label="Review context"

    >

      <dl className={cn("m-0 grid gap-2 sm:grid-cols-2 lg:grid-cols-4", OPERATOR_TYPOGRAPHY.body)}>

        <div>

          <dt className="m-0 text-al-text-secondary">Review</dt>

          <dd className="m-0 mt-0.5 font-semibold text-al-text-primary">{context.reviewName}</dd>

        </div>

        <div>

          <dt className="m-0 text-al-text-secondary">Scope</dt>

          <dd className="m-0 mt-0.5 text-al-text-primary">{context.scopeLabel}</dd>

        </div>

        <div>
          <dt className="m-0 text-al-text-secondary">Resolved</dt>
          <dd className="m-0 mt-0.5 text-al-text-primary">
            <time dateTime={context.resolvedAtUtc}>{context.resolvedAtLabel}</time>
          </dd>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">

          <dt className="m-0 text-al-text-secondary">{packScopeLabel}</dt>

          <dd className="m-0 mt-0.5 text-al-text-primary">

            <ul className="m-0 list-none space-y-1 p-0">

              {context.contributingPolicyPacks.map((pack) => (

                <li key={pack.label}>

                  <StandardsRulesPolicyPackReference label={pack.label} href={pack.href} provenanceLabel={pack.provenanceLabel} />

                </li>

              ))}

            </ul>

          </dd>

        </div>

      </dl>

      <details className="mt-3">

        <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>

          {STANDARDS_RULES_RESOLUTION_DISCLOSURE_SUMMARY}

        </summary>

        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{context.resolutionSummary}</p>

      </details>

    </section>

  );

}


