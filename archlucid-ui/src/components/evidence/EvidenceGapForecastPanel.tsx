import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  deriveEvidenceGapForecast,
  EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_DETAIL_INTRO,
  EVIDENCE_COVERAGE_HELP_HREF,
  EVIDENCE_COVERAGE_HELP_LINK_LABEL,
  EVIDENCE_GAP_FORECAST_DISCLAIMER,
  EVIDENCE_GAP_FORECAST_PANEL_TITLE,
  formatEvidenceGapForecastHeadline,
  summarizeEvidenceCoverage,
  type EvidenceGapForecastEntry,
  type EvidencePresenceFlags,
} from "@/lib/evidence-gap-forecast";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * How much of the forecast a surface renders inline.
 *
 * - `expandable` — one-line status with the per-class detail collapsed behind a disclosure.
 *   Use where the operator can attach evidence without leaving the page.
 * - `summary` — the status line only. Use on confirm/summary surfaces with no upload affordance.
 */
export type EvidenceGapForecastPresentation = "expandable" | "summary";

export type EvidenceGapForecastPanelProps = {
  readonly presence: EvidencePresenceFlags;
  readonly attachmentFileNames?: readonly string[];
  readonly architectureContextPresent?: boolean;
  readonly addEvidenceHref?: string | null;
  readonly presentation?: EvidenceGapForecastPresentation;
};

/** TB-2177: directional forecast of thinner finding domains when evidence classes are missing. */
export function EvidenceGapForecastPanel(props: EvidenceGapForecastPanelProps): React.JSX.Element | null {
  const forecast = deriveEvidenceGapForecast(props.presence);

  if (forecast.length === 0) {
    return null;
  }

  const summary = summarizeEvidenceCoverage(props.presence, {
    attachmentFileNames: props.attachmentFileNames,
    architectureContextPresent: props.architectureContextPresent,
  });
  const summaryLine = summary.summaryLine;
  const documentAttachedContext = summary.usesDocumentAttachedSummary;
  const presentation = props.presentation ?? "expandable";

  switch (presentation) {
    case "summary":
      return <CoverageSummaryLine summaryLine={summaryLine} />;
    case "expandable":
      return (
        <CollapsibleSection
          title={EVIDENCE_GAP_FORECAST_PANEL_TITLE}
          headingLevel={2}
          summaryLine={summaryLine}
          sectionTestId="evidence-gap-forecast-panel"
        >
          <div className="space-y-3">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {EVIDENCE_GAP_FORECAST_DISCLAIMER} <CoverageHelpLink />
            </p>
            {documentAttachedContext ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {EVIDENCE_COVERAGE_DOCUMENT_ATTACHED_DETAIL_INTRO}
              </p>
            ) : null}
            <ul className={cn("m-0 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
              {forecast.map((entry) => (
                <ForecastRow
                  key={entry.missingClass}
                  entry={entry}
                  addEvidenceHref={props.addEvidenceHref}
                  documentAttachedContext={documentAttachedContext}
                />
              ))}
            </ul>
          </div>
        </CollapsibleSection>
      );
    default: {
      const unhandled: never = presentation;

      throw new Error(`Unhandled evidence gap forecast presentation: ${String(unhandled)}`);
    }
  }
}

type CoverageSummaryLineProps = {
  readonly summaryLine: string;
};

function CoverageSummaryLine(props: CoverageSummaryLineProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="evidence-gap-forecast-summary"
    >
      {props.summaryLine} <CoverageHelpLink />
    </p>
  );
}

function CoverageHelpLink(): React.JSX.Element {
  return (
    <Link
      href={EVIDENCE_COVERAGE_HELP_HREF}
      className={OPERATOR_LINK.inline}
      data-testid="evidence-gap-forecast-help-link"
    >
      {EVIDENCE_COVERAGE_HELP_LINK_LABEL}
    </Link>
  );
}

type ForecastRowProps = {
  readonly entry: EvidenceGapForecastEntry;
  readonly addEvidenceHref: string | null | undefined;
  readonly documentAttachedContext: boolean;
};

function ForecastRow(props: ForecastRowProps): React.JSX.Element {
  const { entry, addEvidenceHref, documentAttachedContext } = props;

  return (
    <li data-testid={`evidence-gap-forecast-${entry.missingClass}`}>
      <p className="m-0 font-medium text-al-text-primary">
        {formatEvidenceGapForecastHeadline(entry, { documentAttachedContext })}
      </p>
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
