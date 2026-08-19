"use client";

import { cn } from "@/lib/utils";
import { useEffect, useId, useRef } from "react";

import { TurnstileBotChallenge } from "@/components/auth/TurnstileBotChallenge";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";

export type SignInEmailStepProps = {
  readonly email: string;
  readonly pending: boolean;
  readonly errorMessage: string | null;
  readonly statusMessage: string | null;
  readonly onEmailChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onBack: () => void;
  readonly onBotChallengeTokenChange?: (token: string | null) => void;
};

export function SignInEmailStep({
  email,
  pending,
  errorMessage,
  statusMessage,
  onEmailChange,
  onSubmit,
  onBack,
  onBotChallengeTokenChange,
}: SignInEmailStepProps) {
  const emailId = useId();
  const errorId = useId();
  const statusId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div data-testid="sign-in-email-step">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{SIGN_IN_PAGE_COPY.emailTitle}</h1>
      <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SIGN_IN_PAGE_COPY.emailLead}</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label className={cn("block text-al-text-primary", OPERATOR_TYPOGRAPHY.label)} htmlFor={emailId}>
            {SIGN_IN_PAGE_COPY.emailLabel}
          </label>
          <input
            ref={inputRef}
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            enterKeyHint="send"
            required
            disabled={pending}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-base text-al-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-primary-action-ring)] disabled:opacity-60 dark:border-neutral-600 dark:bg-neutral-900"
            aria-invalid={errorMessage ? true : undefined}
            aria-describedby={errorMessage ? errorId : statusMessage ? statusId : undefined}
            data-testid="sign-in-email-input"
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
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={pending} data-testid="sign-in-send-code">
            {pending ? SIGN_IN_PAGE_COPY.sendingCode : SIGN_IN_PAGE_COPY.sendCode}
          </Button>
          <Button type="button" variant="outline" onClick={onBack} disabled={pending} data-testid="sign-in-email-back">
            {SIGN_IN_PAGE_COPY.backToOptions}
          </Button>
        </div>
      </form>
    </div>
  );
}
