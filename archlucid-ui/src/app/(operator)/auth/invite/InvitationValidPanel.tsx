"use client";

import Link from "next/link";

import { InvitationAuthSecondaryExitActions } from "@/app/(operator)/auth/invite/InvitationAuthSecondaryExitActions";
import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveInvitationAppRolePresentation } from "@/lib/auth/invitation-valid-panel";
import type { InvitationValidationResponse } from "@/lib/auth/invitation-validation-api";
import { cn } from "@/lib/utils";

export type InvitationValidPanelProps = {
  readonly validation: InvitationValidationResponse;
  readonly signInHref: string;
};

export function InvitationValidPanel({ validation, signInHref }: InvitationValidPanelProps) {
  const rolePresentation = resolveInvitationAppRolePresentation(validation.appRole);

  return (
    <div
      className={cn("mt-6 space-y-4 p-4", DESIGN_TOKENS.surface.card)}
      data-testid="invitation-valid-panel"
    >
      {validation.maskedInvitedEmail ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Invited address: {validation.maskedInvitedEmail}
        </p>
      ) : null}

      {rolePresentation ? (
        <div className="space-y-1" data-testid="invitation-valid-role">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Workspace role: {rolePresentation.label}
          </p>
          {rolePresentation.claimCaption ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{rolePresentation.claimCaption}</p>
          ) : null}
        </div>
      ) : null}

      {validation.requireEnterpriseSso && validation.routingMessage ? (
        <div
          className={cn(DESIGN_TOKENS.callout.warn, "space-y-1")}
          data-testid="invitation-valid-sso-callout"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{validation.routingMessage}</p>
        </div>
      ) : null}

      <Button asChild data-testid="invitation-valid-continue-sign-in">
        <Link href={signInHref}>Continue to sign in</Link>
      </Button>

      <InvitationAuthSecondaryExitActions />
    </div>
  );
}
