import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AUTHENTICATION_SIGN_IN_HELP_ACTION_LEAD,
  AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE,
  AUTHENTICATION_SIGN_IN_HELP_EVALUATION_SUMMARY,
  AUTHENTICATION_SIGN_IN_HELP_INVITATION_SUMMARY,
  AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION,
  AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS,
} from "@/lib/authentication-sign-in-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** First-viewport sign-in, evaluation, and invitation CTAs for authentication help (HEU). */
export function HelpAuthenticationSignInActionPanel(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-authentication-sign-in-action-panel-heading"
      className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-authentication-sign-in-action-panel"
    >
      <h2
        id="help-authentication-sign-in-action-panel-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {AUTHENTICATION_SIGN_IN_HELP_ACTION_PANEL_TITLE}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {AUTHENTICATION_SIGN_IN_HELP_ACTION_LEAD}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="primary" data-testid={AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.testId}>
          <Link href={AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.href}>
            {AUTHENTICATION_SIGN_IN_HELP_PRIMARY_ACTION.label}
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          data-testid={AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.startEvaluation.testId}
        >
          <Link href={AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.startEvaluation.href}>
            {AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.startEvaluation.label}
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          data-testid={AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.acceptInvitation.testId}
        >
          <Link href={AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.acceptInvitation.href}>
            {AUTHENTICATION_SIGN_IN_HELP_SECONDARY_ACTIONS.acceptInvitation.label}
          </Link>
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Evaluation: </span>
          {AUTHENTICATION_SIGN_IN_HELP_EVALUATION_SUMMARY}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Invitation: </span>
          {AUTHENTICATION_SIGN_IN_HELP_INVITATION_SUMMARY}
        </p>
      </div>
    </section>
  );
}
