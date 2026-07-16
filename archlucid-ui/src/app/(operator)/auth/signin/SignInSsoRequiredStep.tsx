"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";

export type SignInSsoRequiredStepProps = {
  readonly onContinueOrganizationSignIn: () => void;
  readonly onUseAnotherEmail: () => void;
};

export function SignInSsoRequiredStep({
  onContinueOrganizationSignIn,
  onUseAnotherEmail,
}: SignInSsoRequiredStepProps) {
  return (
    <div className="max-w-[560px]" data-testid="sign-in-sso-required-step">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SIGN_IN_PAGE_COPY.ssoTitle}</h1>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SIGN_IN_PAGE_COPY.ssoLead}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={onContinueOrganizationSignIn}
          data-testid="sign-in-sso-continue"
        >
          {SIGN_IN_PAGE_COPY.ssoPrimary}
        </Button>
        <Button type="button" variant="ghost" onClick={onUseAnotherEmail} data-testid="sign-in-sso-another-email">
          {SIGN_IN_PAGE_COPY.ssoUseAnotherEmail}
        </Button>
      </div>
    </div>
  );
}
