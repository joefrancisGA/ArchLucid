import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { WhyArchLucidDemoUniverse } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";
import { whyArchLucidSponsorPackSourceLine } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidSponsorPackBody } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidSponsorPackBody";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type WhyArchLucidSponsorEvidencePackSectionProps = {
  readonly state: WhyArchLucidPageState;
  readonly universe: WhyArchLucidDemoUniverse;
};

export function WhyArchLucidSponsorEvidencePackSection(props: WhyArchLucidSponsorEvidencePackSectionProps) {
  const { state, universe } = props;

  const pct = (ratio: number) => (Number.isFinite(ratio) ? `${(ratio * 100).toFixed(1)}%` : "0%");

  return (
    <section
      aria-labelledby="why-archlucid-sponsor-pack-heading"
      data-testid="why-archlucid-sponsor-pack"
      className="space-y-3 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
    >
      <div>
        <h2 id="why-archlucid-sponsor-pack-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Sponsor KPI evidence pack
        </h2>
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="why-archlucid-sponsor-pack-source">
          {whyArchLucidSponsorPackSourceLine(universe)}
        </p>
      </div>

      {state.sponsorPackError ? (
        <OperatorApiProblem
          problem={state.sponsorPackError.problem}
          fallbackMessage={state.sponsorPackError.message}
          correlationId={state.sponsorPackError.correlationId}
        />
      ) : null}

      {state.sponsorPack && !state.loading ? (
        <WhyArchLucidSponsorPackBody sponsorPack={state.sponsorPack} pct={pct} />
      ) : state.loading ? (
        <div className="space-y-2" role="status" aria-busy aria-label="Loading sponsor evidence pack">
          <div className="h-4 max-w-xl animate-pulse rounded bg-neutral-100 dark:bg-neutral-900/80" />
          <div className="h-28 animate-pulse rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/70" />
        </div>
      ) : (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Evidence pack unavailable.</p>
      )}
    </section>
  );
}
