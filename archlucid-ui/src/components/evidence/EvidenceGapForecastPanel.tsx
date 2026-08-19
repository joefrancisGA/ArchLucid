import Link from "next/link";

import {
  deriveEvidenceGapForecast,
  EVIDENCE_GAP_FORECAST_DISCLAIMER,
  formatEvidenceGapForecastHeadline,
  type EvidenceGapForecastEntry,
  type EvidencePresenceFlags,
} from "@/lib/evidence-gap-forecast";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type EvidenceGapForecastPanelProps = {
  readonly presence: EvidencePresenceFlags;
  readonly addEvidenceHref?: string | null;
};

/** TB-2177: directional forecast of thinner finding domains when evidence classes are missing. */
export function EvidenceGapForecastPanel(props: EvidenceGapForecastPanelProps): React.JSX.Element | null {
  const forecast = deriveEvidenceGapForecast(props.presence);

  if (forecast.length === 0) {
    return null;
  }

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.neutral, "space-y-3 p-4")}
      data-testid="evidence-gap-forecast-panel"
      aria-labelledby="evidence-gap-forecast-heading"
    >
      <div className="space-y-1">
        <h2
          id="evidence-gap-forecast-heading"
          className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Expected finding coverage
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {EVIDENCE_GAP_FORECAST_DISCLAIMER}
        </p>
      </div>

      <ul className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {forecast.map((entry) => (
          <ForecastRow key={entry.missingClass} entry={entry} addEvidenceHref={props.addEvidenceHref} />
        ))}
      </ul>
    </aside>
  );
}

type ForecastRowProps = {
  readonly entry: EvidenceGapForecastEntry;
  readonly addEvidenceHref: string | null | undefined;
};

function ForecastRow(props: ForecastRowProps): React.JSX.Element {
  const { entry, addEvidenceHref } = props;

  return (
    <li data-testid={`evidence-gap-forecast-${entry.missingClass}`}>
      <p className="m-0 font-medium text-al-text-primary">{formatEvidenceGapForecastHeadline(entry)}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{entry.guidance}</p>
      {addEvidenceHref !== null && addEvidenceHref !== undefined && addEvidenceHref.length > 0 ? (
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={addEvidenceHref} className={OPERATOR_LINK.optional}>
            Add {entry.label.toLowerCase()}
          </Link>
        </p>
      ) : null}
    </li>
  );
}
