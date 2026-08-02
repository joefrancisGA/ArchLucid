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
 * Executive-style package strip for `/see-it` — reads like a deliverable, not a field dump.
 */
export function SeeItPackageSummary(props: SeeItPackageSummaryProps): React.JSX.Element {
  const { reviewTitle, policyPackLabel, findingCountDisplay, complianceGapDisplay } = props;

  const findingsLabel =
    findingCountDisplay === "1" ? "1 finding" : `${findingCountDisplay} findings`;

  let monitoredLabel: string | null = null;

  if (complianceGapDisplay !== "—" && complianceGapDisplay !== "0") {
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
        <StatusTag kind="approved" data-testid="see-it-summary-status" />
      </div>

      <dl
        className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="see-it-summary-stats"
      >
        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/50">
          <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Findings
          </dt>
          <dd
            className={cn("mt-1 m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}
            data-testid="see-it-finding-counts"
          >
            {findingsLabel}
            {monitoredLabel ? (
              <span className={cn("mt-1 block font-normal text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                {monitoredLabel}
              </span>
            ) : null}
          </dd>
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/50">
          <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Policy pack
          </dt>
          <dd className={cn("mt-1 m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
            {policyPackLabel}
          </dd>
        </div>

        <div className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/50 sm:col-span-2 lg:col-span-1">
          <dt className={cn("font-medium text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
            Package readiness
          </dt>
          <dd className={cn("mt-1 m-0 space-y-1 text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>
            <p className="m-0">Evidence complete</p>
            <p className="m-0">Audit trail ready</p>
          </dd>
        </div>
      </dl>
    </section>
  );
}
