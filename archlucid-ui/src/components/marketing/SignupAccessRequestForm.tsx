"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";

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
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { MARKETING_FORM_COLUMN_CLASS, MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractEmailDomainForAnalytics } from "@/lib/marketing/extract-email-domain-for-analytics";
import { isSubmittableWorkEmail } from "@/lib/marketing/is-submittable-work-email";
import { recordMarketingCtaEarlyAccessSubmit } from "@/lib/marketing/marketing-clarity-custom-event";
import {
  SIGNUP_INVITE_ONLY_DATA_USE_LINE,
  SIGNUP_INVITE_ONLY_FORM_INTRO,
  SIGNUP_INVITE_ONLY_SECONDARY_CTA_LABEL,
  SIGNUP_INVITE_ONLY_SUBMIT_LABEL,
  SIGNUP_INVITE_ONLY_THANKS,
} from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "architect", label: "Architect / engineer" },
  { value: "engineering_lead", label: "Engineering lead" },
  { value: "product_program", label: "Product / program" },
  { value: "procurement_it", label: "Procurement / IT" },
  { value: "security_risk", label: "Security / risk" },
  { value: "other", label: "Other" },
];

const SIGNUP_ACCESS_PRIMARY_DISABLED_CLASS =
  "disabled:bg-neutral-200 disabled:text-neutral-700 disabled:opacity-100 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-200";

/**
 * Invite-only `/signup` capture — fields always visible (no click-to-reveal gate).
 * Reuses marketing early-access API; Clarity source = signup.
 */
export function SignupAccessRequestForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const emailFieldId = useId();
  const emailErrorId = useId();
  const emailReadinessId = useId();
  const successStatusId = useId();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = isSubmittableWorkEmail(email);
  const showEmailFormatError = emailTouched && email.trim().length > 0 && !emailValid;
  const canSubmit = emailValid && !busy;

  const emailDescribedBy = [
    showEmailFormatError ? emailErrorId : null,
    !canSubmit && !busy && !done ? emailReadinessId : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ");

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setEmailTouched(true);

    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`/api/proxy/${ApiV1Routes.marketingEarlyAccess}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          companyName: companyName.trim() === "" ? null : companyName.trim(),
          role: role.trim() === "" ? null : role.trim(),
          websiteUrl,
          utmSource: searchParams.get("utm_source") ?? null,
          utmMedium: searchParams.get("utm_medium") ?? null,
          utmCampaign: searchParams.get("utm_campaign") ?? null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      recordMarketingCtaEarlyAccessSubmit({
        source: "signup",
        email_domain: extractEmailDomainForAnalytics(email),
        utm_source: searchParams.get("utm_source") ?? undefined,
        utm_medium: searchParams.get("utm_medium") ?? undefined,
        utm_campaign: searchParams.get("utm_campaign") ?? undefined,
      });

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p
        id={successStatusId}
        className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}
        data-testid="signup-access-request-thanks"
        role="status"
      >
        {SIGNUP_INVITE_ONLY_THANKS}
      </p>
    );
  }

  return (
    <form
      onSubmit={(ev) => void onSubmit(ev)}
      className={cn("relative mt-6 space-y-4", MARKETING_FORM_COLUMN_CLASS)}
      aria-label="Evaluation access request"
      data-testid="signup-access-request-form"
      noValidate
    >
      <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{SIGNUP_INVITE_ONLY_FORM_INTRO}</p>
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
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-describedby={emailDescribedBy.length > 0 ? emailDescribedBy : undefined}
          aria-invalid={showEmailFormatError}
          className="mt-1.5 h-10"
        />
        {showEmailFormatError ? (
          <p id={emailErrorId} className={cn("mt-1 text-red-600 dark:text-red-400", MARKETING_TYPOGRAPHY.meta)} role="alert">
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
          value={companyName}
          onChange={(ev) => setCompanyName(ev.target.value)}
          className="mt-1.5 h-10"
        />
      </div>
      <div>
        <Label htmlFor="signup-access-role" className={MARKETING_TYPOGRAPHY.formLabel}>
          Role <span className="font-normal text-al-text-secondary">(optional)</span>
        </Label>
        <Select value={role === "" ? "__none__" : role} onValueChange={(value) => setRole(value === "__none__" ? "" : value)}>
          <SelectTrigger id="signup-access-role" className="mt-1.5 h-10" data-testid="signup-access-role-select">
            <SelectValue placeholder="Role (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Role (optional)</SelectItem>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="pointer-events-none absolute -left-[9999px] top-0 opacity-0" aria-hidden>
        <label>
          Website
          <input tabIndex={-1} type="text" name="website" value={websiteUrl} onChange={(ev) => setWebsiteUrl(ev.target.value)} />
        </label>
      </div>
      <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
        {SIGNUP_INVITE_ONLY_DATA_USE_LINE}{" "}
        <Link href="/privacy" className={MARKETING_SURFACES.inlineLink}>
          privacy policy
        </Link>
        .
      </p>
      {error ? (
        <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}
      {!canSubmit && !busy ? (
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
          disabled={!canSubmit}
          variant="primary"
          className={cn("w-full sm:w-auto", SIGNUP_ACCESS_PRIMARY_DISABLED_CLASS)}
        >
          {busy ? "Sending…" : SIGNUP_INVITE_ONLY_SUBMIT_LABEL}
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
