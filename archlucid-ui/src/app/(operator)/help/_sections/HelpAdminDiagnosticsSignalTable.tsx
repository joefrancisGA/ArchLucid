import {
  ADMIN_DIAGNOSTICS_HELP_SIGNAL_HEALTHY_COLUMN,
  ADMIN_DIAGNOSTICS_HELP_SIGNAL_ROWS,
  ADMIN_DIAGNOSTICS_HELP_SIGNAL_SECTION_TITLE,
} from "@/lib/admin-diagnostics-help-evidence-copy";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

/** Structured signal reference for admin diagnostics help (HAE). */
export function HelpAdminDiagnosticsSignalTable(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-admin-diagnostics-signals-heading"
      className="space-y-3 border-t border-neutral-200 pt-6 dark:border-neutral-800"
      data-testid="help-admin-diagnostics-signal-table"
    >
      <h2
        id="help-admin-diagnostics-signals-heading"
        className={cn("m-0", OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ADMIN_DIAGNOSTICS_HELP_SIGNAL_SECTION_TITLE}
      </h2>
      <div className={HELP_PAGE_LAYOUT.tableWrap}>
        <table className={HELP_PAGE_LAYOUT.table}>
          <caption className="sr-only">Admin diagnostics signal reference — illustrative healthy examples, not live status</caption>
          <thead>
            <tr>
              <th className={HELP_PAGE_LAYOUT.tableHeadCell} scope="col">
                Signal
              </th>
              <th className={HELP_PAGE_LAYOUT.tableHeadCell} scope="col">
                {ADMIN_DIAGNOSTICS_HELP_SIGNAL_HEALTHY_COLUMN}
              </th>
              <th className={HELP_PAGE_LAYOUT.tableHeadCell} scope="col">
                What to do next
              </th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_DIAGNOSTICS_HELP_SIGNAL_ROWS.map((row, index) => (
              <tr
                key={row.signal}
                className={index % 2 === 0 ? HELP_PAGE_LAYOUT.tableRowOdd : HELP_PAGE_LAYOUT.tableRowEven}
              >
                <th className={HELP_PAGE_LAYOUT.tableBodyCell} scope="row">
                  {row.signal}
                </th>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.healthyDescription}</td>
                <td className={HELP_PAGE_LAYOUT.tableBodyCell}>{row.nextStep}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
