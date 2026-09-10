import {
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE,
  SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/sponsor-dashboard-help-evidence-copy";
import { SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID } from "@/lib/sponsor-dashboard-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/sponsor-dashboard` — header info strip (TB-2092). */
export function SponsorDashboardHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-sponsor-dashboard-claim-discipline-strip"
      aria-labelledby={SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={SPONSOR_DASHBOARD_HELP_CLAIM_HEADING_ID}
        className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "m-0 scroll-mt-24", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SPONSOR_DASHBOARD_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
