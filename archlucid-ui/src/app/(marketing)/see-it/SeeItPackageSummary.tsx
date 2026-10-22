import { StatusTag } from "@/components/ui/status-tag";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type SeeItPackageSummaryProps = {
  readonly reviewTitle: string;
  readonly policyPackLabel: string;
  readonly findingCountDisplay: string;
  readonly complianceGapDisplay: string;
};

/**
 * Sponsor-style package strip for `/see-it` — reads like a deliverable, not a field dump.
 */
export function SeeItPackageSummary(props: SeeItPackageSummaryProps): React.JSX.Element {
  const { reviewTitle, policyPackLabel, findingCountDisplay, complianceGapDisplay } = props;

  const findingsUnit = findingCountDisplay === "1" ? "finding" : "findings";

  let monitoredLabel: string | null = null;

  if (complianceGapDisplay !== " — " && complianceGapDisplay !== "0") {
    monitoredLabel =
      complianceGapDisplay === "1"
        ? "1 monitored risk"
        : `${complianceGapDisplay} monitored risks`;
  }

  return (
    <section data-testid="see-it-summary" className={MARKETING_SURFACES.cardComfort}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={cn("m-0", MARKETING_TYPOGRAPHY.sectionTitle)}>{reviewTitle}</h2>
          <p className={cn("mt-2 m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Finalized sample architecture proof export (read-only)
          </p>
        </div>
        <StatusTag
          kind="approved"
          data-testid="see-it-summary-status"
          className="px-2.5 py-1 text-sm font-semibold"
        />
      </div>

      <dl
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="see-it-summary-stats"
      >
        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/50">
          <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Findings
          </dt>
          <dd className="mt-2 m-0" data-testid="see-it-finding-counts">
            <span className="block text-3xl font-semibold tabular-nums tracking-tight text-al-text-primary">
              {findingCountDisplay}
            </span>
            <span className={cn("mt-1 block text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              {findingsUnit}
            </span>
            {monitoredLabel ? (
              <span className={cn("mt-1 block text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                {monitoredLabel}
              </span>
            ) : null}
          </dd>
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/50">
          <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Policy pack
          </dt>
          <dd className={cn("mt-2 m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
            {policyPackLabel}
          </dd>
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950/50 sm:col-span-2 lg:col-span-1">
          <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Package readiness (sample)
          </dt>
          <dd className="mt-2 m-0 space-y-1">
            <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              Sample shows evidence complete
            </p>
            <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              Sample shows audit trail ready
            </p>
          </dd>
        </div>
      </dl>
    </section>
  );
}
