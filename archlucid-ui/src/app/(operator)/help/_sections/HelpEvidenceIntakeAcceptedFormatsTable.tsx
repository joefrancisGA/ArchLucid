import {
  EVIDENCE_UPLOAD_ACCEPTED_FORMAT_ROWS,
} from "@/lib/evidence-upload-accepted-formats";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Authoritative accepted-format table for `/help/evidence-intake` (wizard-aligned). */
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
        Accepted evidence formats
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        The New architecture review wizard accepts these file extensions. Unsupported types show a validation message
        before analysis starts.
      </p>
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
    </section>
  );
}
