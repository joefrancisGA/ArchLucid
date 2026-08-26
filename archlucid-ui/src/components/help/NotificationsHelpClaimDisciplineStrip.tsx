import { NOTIFICATIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/notifications-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/notifications` — header info strip (TB-2092). */
export function NotificationsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-notifications-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{NOTIFICATIONS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
