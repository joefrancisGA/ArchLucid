"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useRef } from "react";

import { TurnstileBotChallenge } from "@/components/auth/TurnstileBotChallenge";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";

export type SignInCodeStepProps = {
  readonly maskedEmail: string;
  readonly code: string;
  readonly pending: boolean;
  readonly resendPending: boolean;
  readonly resendSecondsRemaining: number;
  readonly errorMessage: string | null;
  readonly statusMessage: string | null;
  readonly onCodeChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onResend: () => void;
  readonly onDifferentEmail: () => void;
  /** Fresh Turnstile token for resend (tokens are single-use). */
  readonly onBotChallengeTokenChange?: (token: string | null) => void;
};

export function SignInCodeStep({
  maskedEmail,
  code,
  pending,
  resendPending,
  resendSecondsRemaining,
  errorMessage,
  statusMessage,
  onCodeChange,
  onSubmit,
  onResend,
  onDifferentEmail,
  onBotChallengeTokenChange,
}: SignInCodeStepProps) {
  const codeId = useId();
  const errorId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resendDisabled = pending || resendPending || resendSecondsRemaining > 0;

  return (
    <div data-testid="sign-in-code-step">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SIGN_IN_PAGE_COPY.codeTitle}</h1>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {SIGN_IN_PAGE_COPY.codeLeadPrefix}{" "}
        <span className="font-medium text-al-text-primary">{maskedEmail}</span>.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label className={cn("block text-al-text-primary", OPERATOR_TYPOGRAPHY.label)} htmlFor={codeId}>
            {SIGN_IN_PAGE_COPY.codeLabel}
          </label>
          <input
            ref={inputRef}
            id={codeId}
            name="one-time-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            pattern="[0-9]*"
            maxLength={10}
            required
            disabled={pending}
            value={code}
            onChange={(event) => onCodeChange(event.target.value.replace(/\s+/g, ""))}
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base tracking-widest text-al-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-primary-action-ring)] disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900"
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={
              errorMessage ? errorId : statusMessage ? statusId : undefined
            }
            data-testid="sign-in-code-input"
          />
        </div>
        {errorMessage ? (
          <p id={errorId} role="alert" className="text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? (
          <p id={statusId} role="status" aria-live="polite" className="text-sm text-al-text-secondary">
            {statusMessage}
          </p>
        ) : null}
        {onBotChallengeTokenChange ? (
          <TurnstileBotChallenge onTokenChange={onBotChallengeTokenChange} />
        ) : null}
        <div className="flex flex-col gap-3">
          <Button type="submit" variant="primary" disabled={pending} className="w-full sm:w-fit" data-testid="sign-in-code-continue">
            {pending ? SIGN_IN_PAGE_COPY.completingSignIn : SIGN_IN_PAGE_COPY.continue}
          </Button>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resendDisabled}
              onClick={onResend}
              data-testid="sign-in-code-resend"
            >
              {SIGN_IN_PAGE_COPY.sendNewCode}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDifferentEmail}
              disabled={pending}
              data-testid="sign-in-code-different-email"
            >
              {SIGN_IN_PAGE_COPY.useDifferentEmail}
            </Button>
          </div>
        </div>
        {resendSecondsRemaining > 0 ? (
          <p role="status" aria-live="polite" className="text-sm text-al-text-secondary">
            {SIGN_IN_PAGE_COPY.resendCountdown(resendSecondsRemaining)}
          </p>
        ) : null}
      </form>
    </div>
  );
}
