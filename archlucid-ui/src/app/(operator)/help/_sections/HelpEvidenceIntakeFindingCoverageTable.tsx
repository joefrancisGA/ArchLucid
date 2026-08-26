import {
  EVIDENCE_INTAKE_HELP_FINDING_COVERAGE_DISCLOSURE_LABEL,
  EVIDENCE_INTAKE_HELP_FINDING_COVERAGE_TITLE,
} from "@/lib/evidence-intake-help-guide-content";
import {
  EVIDENCE_GAP_FORECAST_DISCLAIMER,
  listEvidenceCoverageReferenceRows,
} from "@/lib/evidence-gap-forecast";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Durable explanation behind the "Expected finding coverage" disclosure on intake and evidence
 * surfaces. Rows come from the same map the in-product forecast uses, so the two cannot drift.
 */
export function HelpEvidenceIntakeFindingCoverageTable(): React.ReactElement {
  const rows = listEvidenceCoverageReferenceRows();

  return (
    <section
      aria-labelledby="help-evidence-intake-coverage-heading"
      data-testid="help-evidence-intake-finding-coverage"
      id="finding-coverage"
    >
      <details className={HELP_PAGE_LAYOUT.details}>
        <summary
          id="help-evidence-intake-coverage-heading"
          className={cn("cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden", OPERATOR_TYPOGRAPHY.sectionTitle, "text-al-text-primary")}
        >
          {EVIDENCE_INTAKE_HELP_FINDING_COVERAGE_DISCLOSURE_LABEL}
        </summary>
        <div className={HELP_PAGE_LAYOUT.detailsBody}>
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {EVIDENCE_INTAKE_HELP_FINDING_COVERAGE_TITLE}
          </h3>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Each class of evidence gives reviewers something concrete to cite. When a class is missing, findings in the
            domains it supports tend to stay generic. {EVIDENCE_GAP_FORECAST_DISCLAIMER}
          </p>
          <div className={HELP_PAGE_LAYOUT.compactTableWrap}>
            <table className={HELP_PAGE_LAYOUT.table}>
              <caption className="sr-only">Evidence classes and the finding domains they strengthen</caption>
              <thead>
                <tr>
                  <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                    Evidence class
                  </th>
                  <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                    Strengthens findings in
                  </th>
                  <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                    Why it helps
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.classId}
                    className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                  >
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.label}</td>
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.strengthens}</td>
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.guidance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </section>
  );
}
