"use client";

import Link from "next/link";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseMarketingEarlyAccessSubmitResult } from "@/hooks/use-marketing-early-access-submit";
import {
  MARKETING_FORM_COLUMN_CLASS,
  MARKETING_SURFACES,
  MARKETING_TYPOGRAPHY,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  MARKETING_ROLE_NONE_LABEL,
  MARKETING_ROLE_OPTIONS,
  MARKETING_ROLE_SELECT_NONE_VALUE,
} from "@/lib/marketing/marketing-role-options";
import {
  SIGNUP_INVITE_ONLY_DATA_USE_LINE,
  SIGNUP_INVITE_ONLY_SECONDARY_CTA_LABEL,
} from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

const SIGNUP_ACCESS_PRIMARY_DISABLED_CLASS =
  "disabled:bg-neutral-200 disabled:text-neutral-700 disabled:opacity-100 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-200";

export type MarketingEarlyAccessFormVariant = "hero" | "signup";

export type MarketingEarlyAccessThanksProps = {
  readonly variant: MarketingEarlyAccessFormVariant;
  readonly thanksCopy: string;
  readonly className?: string;
};

export function MarketingEarlyAccessThanks(props: MarketingEarlyAccessThanksProps): React.JSX.Element {
  const successStatusId = useId();

  if (props.variant === "signup") {
    return (
      <p
        id={successStatusId}
        className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body, props.className)}
        data-testid="signup-access-request-thanks"
        role="status"
      >
        {props.thanksCopy}
      </p>
    );
  }

  return (
    <p
      className={cn(
        "mx-auto mt-4 max-w-md text-center text-neutral-700 dark:text-neutral-300",
        OPERATOR_TYPOGRAPHY.body,
        props.className,
      )}
      data-testid="welcome-early-access-thanks"
    >
      {props.thanksCopy}
    </p>
  );
}

export type MarketingEarlyAccessFormProps = {
  readonly variant: MarketingEarlyAccessFormVariant;
  readonly submitState: UseMarketingEarlyAccessSubmitResult;
  readonly className?: string;
  readonly intro?: string;
  readonly submitLabel: string;
  readonly onCancel?: () => void;
  readonly showCancel?: boolean;
};

export function MarketingEarlyAccessForm(props: MarketingEarlyAccessFormProps): React.JSX.Element {
  const emailFieldId = useId();
  const emailErrorId = useId();
  const emailReadinessId = useId();
  const submitState = props.submitState;

  const emailDescribedBy = [
    submitState.showEmailFormatError ? emailErrorId : null,
    !submitState.canSubmit && !submitState.busy ? emailReadinessId : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ");

  if (props.variant === "signup") {
    return (
      <form
        onSubmit={(event) => void submitState.handleSubmit(event)}
        className={cn("relative mt-6 space-y-4", MARKETING_FORM_COLUMN_CLASS, props.className)}
        aria-label="Evaluation access request"
        data-testid="signup-access-request-form"
        noValidate
      >
        {props.intro ? (
          <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{props.intro}</p>
        ) : null}
        <div>
          <Label htmlFor={emailFieldId} className={MARKETING_TYPOGRAPHY.formLabel}>
            Work email <span className="text-red-600 dark:text-red-400">*</span>
          </Label>
          <Input
            id={emailFieldId}
            type="email"
            autoComplete="email"
            required
            maxLength={320}
            value={submitState.email}
            onChange={(event) => submitState.setEmail(event.target.value)}
            onBlur={submitState.onEmailBlur}
            aria-describedby={emailDescribedBy.length > 0 ? emailDescribedBy : undefined}
            aria-invalid={submitState.showEmailFormatError}
            className="mt-1.5 h-10"
          />
          {submitState.showEmailFormatError ? (
            <p
              id={emailErrorId}
              className={cn("mt-1 text-red-600 dark:text-red-400", MARKETING_TYPOGRAPHY.meta)}
              role="alert"
            >
              Enter a valid work email address.
            </p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="signup-access-company" className={MARKETING_TYPOGRAPHY.formLabel}>
            Organization <span className="font-normal text-al-text-secondary">(optional)</span>
          </Label>
          <Input
            id="signup-access-company"
            type="text"
            autoComplete="organization"
            maxLength={200}
            value={submitState.companyName}
            onChange={(event) => submitState.setCompanyName(event.target.value)}
            className="mt-1.5 h-10"
          />
        </div>
        <div>
          <Label htmlFor="signup-access-role" className={MARKETING_TYPOGRAPHY.formLabel}>
            Role <span className="font-normal text-al-text-secondary">(optional)</span>
          </Label>
          <Select
            value={submitState.role === "" ? MARKETING_ROLE_SELECT_NONE_VALUE : submitState.role}
            onValueChange={(value) =>
              submitState.setRole(value === MARKETING_ROLE_SELECT_NONE_VALUE ? "" : value)
            }
          >
            <SelectTrigger id="signup-access-role" className="mt-1.5 h-10" data-testid="signup-access-role-select">
              <SelectValue placeholder={MARKETING_ROLE_NONE_LABEL} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MARKETING_ROLE_SELECT_NONE_VALUE}>{MARKETING_ROLE_NONE_LABEL}</SelectItem>
              {MARKETING_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <MarketingEarlyAccessHoneypot
          websiteUrl={submitState.websiteUrl}
          onWebsiteUrlChange={submitState.setWebsiteUrl}
        />
        <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          {SIGNUP_INVITE_ONLY_DATA_USE_LINE}{" "}
          <Link href="/privacy" className={MARKETING_SURFACES.inlineLink}>
            privacy policy
          </Link>
          .
        </p>
        {submitState.error ? (
          <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {submitState.error}
          </p>
        ) : null}
        {!submitState.canSubmit && !submitState.busy ? (
          <p
            id={emailReadinessId}
            className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}
            data-testid="signup-access-readiness"
          >
            Enter a valid work email to send your request.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="submit"
            disabled={!submitState.canSubmit}
            variant="primary"
            className={cn("w-full sm:w-auto", SIGNUP_ACCESS_PRIMARY_DISABLED_CLASS)}
          >
            {submitState.busy ? "Sending…" : props.submitLabel}
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/see-it" data-testid="signup-access-secondary-cta">
              {SIGNUP_INVITE_ONLY_SECONDARY_CTA_LABEL}
            </Link>
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(event) => void submitState.handleSubmit(event)}
      className={cn(
        "relative w-full rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
        props.className,
      )}
      aria-label="Early access request"
      data-testid="early-access-request-form"
      noValidate
    >
      {props.intro ? (
        <p className={cn("mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.intro}</p>
      ) : null}
      <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span>Work email</span>
        <input
          id={emailFieldId}
          required
          type="email"
          autoComplete="email"
          maxLength={320}
          value={submitState.email}
          onChange={(event) => submitState.setEmail(event.target.value)}
          onBlur={submitState.onEmailBlur}
          aria-describedby={emailDescribedBy.length > 0 ? emailDescribedBy : undefined}
          aria-invalid={submitState.showEmailFormatError}
          className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
        />
      </label>
      {submitState.showEmailFormatError ? (
        <p
          id={emailErrorId}
          className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
        >
          Enter a valid work email address.
        </p>
      ) : null}
      <label className={cn("mt-3 flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span>Company (optional)</span>
        <input
          type="text"
          autoComplete="organization"
          maxLength={200}
          value={submitState.companyName}
          onChange={(event) => submitState.setCompanyName(event.target.value)}
          className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
        />
      </label>
      <label className={cn("mt-3 flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
        <span>Role</span>
        <select
          value={submitState.role}
          onChange={(event) => submitState.setRole(event.target.value)}
          className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
        >
          <option value="">{MARKETING_ROLE_NONE_LABEL}</option>
          {MARKETING_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <MarketingEarlyAccessHoneypot
        websiteUrl={submitState.websiteUrl}
        onWebsiteUrlChange={submitState.setWebsiteUrl}
      />
      {submitState.error ? (
        <p className={cn("mt-3 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {submitState.error}
        </p>
      ) : null}
      {!submitState.canSubmit && !submitState.busy ? (
        <p
          id={emailReadinessId}
          className={cn("mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        >
          Enter a valid work email to send your request.
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="submit" disabled={!submitState.canSubmit} size="sm" variant="primary">
          {submitState.busy ? "Sending…" : props.submitLabel}
        </Button>
        {props.showCancel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitState.busy}
            onClick={props.onCancel}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

type MarketingEarlyAccessHoneypotProps = {
  readonly websiteUrl: string;
  readonly onWebsiteUrlChange: (value: string) => void;
};

function MarketingEarlyAccessHoneypot(props: MarketingEarlyAccessHoneypotProps): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute -left-[9999px] top-0 opacity-0" aria-hidden>
      <label>
        Website
        <input
          tabIndex={-1}
          type="text"
          name="website"
          value={props.websiteUrl}
          onChange={(event) => props.onWebsiteUrlChange(event.target.value)}
        />
      </label>
    </div>
  );
}
