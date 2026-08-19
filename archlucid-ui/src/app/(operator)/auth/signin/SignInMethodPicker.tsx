"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { recordEmailOtpAuthAnalytics } from "@/lib/auth/email-otp-analytics";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";
import type { SignInMethodOptions } from "@/lib/auth/sign-in-method-options";

export type SignInMethodPickerProps = {
  readonly options: SignInMethodOptions;
  readonly onWorkSchool: () => void;
  readonly onEmailCode: () => void;
  readonly onSupplemental?: (provider: "microsoft" | "google") => void;
};

export function SignInMethodPicker({
  options,
  onWorkSchool,
  onEmailCode,
  onSupplemental,
}: SignInMethodPickerProps) {
  return (
    <div data-testid="sign-in-method-picker">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SIGN_IN_PAGE_COPY.optionsTitle}</h1>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {SIGN_IN_PAGE_COPY.optionsLead}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        {options.emailCode ? (
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center"
            data-testid="sign-in-email-code"
            onClick={() => {
              recordEmailOtpAuthAnalytics("auth_method_selected", { method: "email_code" });
              onEmailCode();
            }}
          >
            {SIGN_IN_PAGE_COPY.emailCodeSecondary}
          </Button>
        ) : null}
        {options.workSchool ? (
          <Button
            type="button"
            variant={options.emailCode ? "outline" : "primary"}
            className="w-full justify-center"
            data-testid="sign-in-work-school"
            onClick={() => {
              recordEmailOtpAuthAnalytics("auth_method_selected", { method: "work_school" });
              onWorkSchool();
            }}
          >
            {SIGN_IN_PAGE_COPY.workSchoolPrimary}
          </Button>
        ) : null}
        {options.supplementalProviders.map((provider) => (
          <Button
            key={provider}
            type="button"
            variant="outline"
            className="w-full justify-center"
            data-testid={`sign-in-supplemental-${provider}`}
            onClick={() => {
              recordEmailOtpAuthAnalytics("auth_method_selected", { method: provider });
              onSupplemental?.(provider);
            }}
          >
            {provider === "microsoft"
              ? SIGN_IN_PAGE_COPY.microsoftSupplemental
              : SIGN_IN_PAGE_COPY.googleSupplemental}
          </Button>
        ))}
      </div>
      <p
        className={cn("mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="sign-in-non-sso-orientation"
      >
        {SIGN_IN_PAGE_COPY.optionsOrientation}
      </p>
    </div>
  );
}
