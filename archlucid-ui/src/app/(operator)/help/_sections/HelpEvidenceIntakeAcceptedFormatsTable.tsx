import {
  EVIDENCE_INTAKE_HELP_ACCEPTED_FORMAT_GROUPS,
  EVIDENCE_INTAKE_HELP_ACCEPTED_FORMATS_DISCLOSURE_LABEL,
  EVIDENCE_INTAKE_HELP_ACCEPTED_FORMATS_INTRO,
  EVIDENCE_INTAKE_HELP_ACCEPTED_FORMATS_TITLE,
} from "@/lib/evidence-intake-help-guide-content";
import {
  EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS,
} from "@/lib/evidence-upload-accepted-formats";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Authoritative accepted-format summary for `/help/evidence-intake` (wizard-aligned). */
export function HelpEvidenceIntakeAcceptedFormatsTable(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-evidence-intake-formats-heading"
      data-testid="help-evidence-intake-accepted-formats"
    >
      <h2
        id="help-evidence-intake-formats-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {EVIDENCE_INTAKE_HELP_ACCEPTED_FORMATS_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {EVIDENCE_INTAKE_HELP_ACCEPTED_FORMATS_INTRO}
      </p>
      <ul className={cn("m-0 mt-3 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {EVIDENCE_INTAKE_HELP_ACCEPTED_FORMAT_GROUPS.map((group) => (
          <li key={group.label} data-testid={`help-evidence-intake-format-group-${group.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <span className="font-medium text-al-text-primary">{group.label}:</span>{" "}
            <span className="text-al-text-secondary">{group.values}</span>
          </li>
        ))}
      </ul>
      <details className={cn("mt-3", HELP_PAGE_LAYOUT.details)} data-testid="help-evidence-intake-formats-disclosure">
        <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {EVIDENCE_INTAKE_HELP_ACCEPTED_FORMATS_DISCLOSURE_LABEL}
        </summary>
        <div className={HELP_PAGE_LAYOUT.detailsBody}>
          <div className={HELP_PAGE_LAYOUT.compactTableWrap}>
            <table className={HELP_PAGE_LAYOUT.table}>
              <caption className="sr-only">Accepted evidence file extensions</caption>
              <thead>
                <tr>
                  <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                    Extension
                  </th>
                  <th scope="col" className={HELP_PAGE_LAYOUT.tableHeadCell}>
                    Format
                  </th>
                </tr>
              </thead>
              <tbody>
                {EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS.map((row, index) => (
                  <tr
                    key={row.extension}
                    className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
                  >
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>
                      <code>{row.extension}</code>
                    </td>
                    <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.label}</td>
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
