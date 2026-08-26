"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusTag } from "@/components/ui/status-tag";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { AuthenticationIdentityLinkProposal } from "@/lib/sign-in-methods-api";
import { digitsOnlyMaxLength, formatCountdown } from "@/lib/sign-in-methods-problem";
import { cn } from "@/lib/utils";

import {
  AccountSecurityFeedbackCallout,
  type AccountSecurityCardFeedback,
} from "./AccountSecurityFeedbackCallout";

export type AccountSecurityAddEmailFormProps = {
  readonly busy: boolean;
  readonly addEmail: string;
  readonly emailTouched: boolean;
  readonly emailValid: boolean;
  readonly challengeId: string | null;
  readonly verificationCode: string;
  readonly codeValid: boolean;
  readonly pendingProposal: AuthenticationIdentityLinkProposal | null;
  readonly proposalRemainingMs: number | null;
  readonly proposalExpired: boolean;
  readonly resendCooldownMs: number;
  readonly addFeedback: AccountSecurityCardFeedback | null;
  readonly onAddEmailChange: (value: string) => void;
  readonly onEmailBlur: () => void;
  readonly onVerificationCodeChange: (value: string) => void;
  readonly onRequestEmailChallenge: () => void;
  readonly onVerifyEmailChallenge: () => void;
  readonly onConfirmProposal: () => void;
  readonly onCancelProposal: () => void;
  readonly onResetAddFlow: () => void;
  readonly onClearAddFeedback: () => void;
};

export function AccountSecurityAddEmailForm(props: AccountSecurityAddEmailFormProps): React.JSX.Element {
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.challengeId === null) {
      return;
    }

    codeInputRef.current?.focus();
  }, [props.challengeId]);

  return (
    <Card data-testid="add-sign-in-method-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Add sign-in method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Add email-code recovery while signed in through your existing method. A different verified email will
          require explicit confirmation before linking.
        </p>

        {props.addFeedback ? (
          <AccountSecurityFeedbackCallout feedback={props.addFeedback} testId="account-security-add-feedback" />
        ) : null}

        <ol className={cn("m-0 list-decimal space-y-4 pl-5", OPERATOR_TYPOGRAPHY.body)}>
          <li className="space-y-2">
            <label
              className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
              htmlFor="link-email"
            >
              Email for one-time code
            </label>
            <Input
              id="link-email"
              type="email"
              autoComplete="email"
              value={props.addEmail}
              aria-invalid={props.emailTouched && !props.emailValid ? true : undefined}
              onChange={(event) => {
                props.onAddEmailChange(event.target.value);
              }}
              onBlur={() => {
                props.onEmailBlur();
              }}
              placeholder="you@example.com"
              disabled={props.busy || props.challengeId !== null}
            />
            {props.emailTouched && !props.emailValid ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                Enter a valid email address before sending a code.
              </p>
            ) : null}
            {props.challengeId === null ? (
              <Button
                type="button"
                data-testid="account-security-send-code"
                onClick={() => {
                  props.onRequestEmailChallenge();
                }}
                disabled={props.busy || !props.emailValid}
              >
                Send verification code
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.busy || props.resendCooldownMs > 0}
                  data-testid="account-security-resend-code"
                  onClick={() => {
                    props.onRequestEmailChallenge();
                  }}
                >
                  {props.resendCooldownMs > 0
                    ? `Resend in ${formatCountdown(props.resendCooldownMs)}`
                    : "Resend code"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={props.busy}
                  data-testid="account-security-different-email"
                  onClick={() => {
                    props.onResetAddFlow();
                    props.onClearAddFeedback();
                  }}
                >
                  Use a different email
                </Button>
              </div>
            )}
          </li>

          {props.challengeId !== null ? (
            <li className="space-y-2 border-t border-al-border pt-4">
              <label
                className={cn("block font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                htmlFor="link-code"
              >
                Verification code
              </label>
              <Input
                ref={codeInputRef}
                id="link-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={props.verificationCode}
                onChange={(event) => {
                  props.onVerificationCodeChange(digitsOnlyMaxLength(event.target.value, 6));
                }}
                placeholder="6-digit code"
                disabled={props.busy || props.pendingProposal !== null}
              />
              <Button
                type="button"
                data-testid="account-security-verify-code"
                onClick={() => {
                  props.onVerifyEmailChallenge();
                }}
                disabled={props.busy || !props.codeValid || props.pendingProposal !== null}
              >
                Verify code
              </Button>
            </li>
          ) : null}
        </ol>

        {props.pendingProposal !== null ? (
          <div
            className={cn(DESIGN_TOKENS.callout.warn, "space-y-3 px-3 py-3")}
            data-testid="account-security-confirm-panel"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag kind="needs-attention" label="Confirm link" />
              {props.proposalRemainingMs !== null ? (
                <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
                  {props.proposalExpired
                    ? "This confirmation expired."
                    : `Expires in ${formatCountdown(props.proposalRemainingMs)}`}
                </span>
              ) : null}
            </div>
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Confirm new sign-in method
            </p>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {props.pendingProposal.confirmationMessage}
            </p>
            {props.pendingProposal.maskedIdentifier ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Identifier: {props.pendingProposal.maskedIdentifier}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {props.proposalExpired ? (
                <Button
                  type="button"
                  data-testid="account-security-start-over"
                  onClick={() => {
                    props.onResetAddFlow();
                    props.onClearAddFeedback();
                  }}
                  disabled={props.busy}
                >
                  Start over
                </Button>
              ) : (
                <Button
                  type="button"
                  data-testid="account-security-confirm-link"
                  onClick={() => {
                    props.onConfirmProposal();
                  }}
                  disabled={props.busy}
                >
                  Confirm link
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                data-testid="account-security-cancel-link"
                onClick={() => {
                  props.onCancelProposal();
                }}
                disabled={props.busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
