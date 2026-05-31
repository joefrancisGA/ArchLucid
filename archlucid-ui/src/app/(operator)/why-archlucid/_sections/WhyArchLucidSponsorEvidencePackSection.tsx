import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidSponsorPackBody } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidSponsorPackBody";

export type WhyArchLucidSponsorEvidencePackSectionProps = {
  readonly state: WhyArchLucidPageState;
};

export function WhyArchLucidSponsorEvidencePackSection(props: WhyArchLucidSponsorEvidencePackSectionProps) {
  const { state } = props;

  const pct = (ratio: number) => (Number.isFinite(ratio) ? `${(ratio * 100).toFixed(1)}%` : "0%");

  return (
    <section
      aria-labelledby="why-archlucid-sponsor-pack-heading"
      data-testid="why-archlucid-sponsor-pack"
      className="space-y-3 rounded border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
    >
      <div>
        <h2
          id="why-archlucid-sponsor-pack-heading"
          className="text-sm font-semibold text-al-text-primary"
        >
          Sponsor KPI evidence pack
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Aggregated sponsor-facing proof from <code className="text-xs">GET /v1/pilots/sponsor-evidence-pack</code> —
          complements the seeded Contoso review below without replacing it.
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
        <p className="text-sm text-neutral-500">Evidence pack unavailable.</p>
      )}
    </section>
  );
}
