"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { extractEmailDomainForAnalytics } from "@/lib/marketing/extract-email-domain-for-analytics";
import { recordMarketingCtaEarlyAccessSubmit } from "@/lib/marketing/marketing-clarity-custom-event";
import {
  SIGNUP_INVITE_ONLY_FORM_INTRO,
  SIGNUP_INVITE_ONLY_SUBMIT_LABEL,
  SIGNUP_INVITE_ONLY_THANKS,
} from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "", label: "Role (optional)" },
  { value: "architect", label: "Architect / engineer" },
  { value: "engineering_lead", label: "Engineering lead" },
  { value: "product_program", label: "Product / program" },
  { value: "procurement_it", label: "Procurement / IT" },
  { value: "security_risk", label: "Security / risk" },
  { value: "other", label: "Other" },
];

/**
 * Invite-only `/signup` capture — fields always visible (no click-to-reveal gate).
 * Reuses marketing early-access API; Clarity source = signup.
 */
export function SignupAccessRequestForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !busy;

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

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
        className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}
        data-testid="signup-access-request-thanks"
      >
        {SIGNUP_INVITE_ONLY_THANKS}
      </p>
    );
  }

  return (
    <form
      onSubmit={(ev) => void onSubmit(ev)}
      className="relative mt-6 space-y-4"
      aria-label="Evaluation access request"
      data-testid="signup-access-request-form"
      noValidate
    >
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SIGNUP_INVITE_ONLY_FORM_INTRO}</p>
      <div>
        <Label htmlFor="signup-access-email" className={MARKETING_TYPOGRAPHY.formLabel}>
          Work email
        </Label>
        <Input
          id="signup-access-email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className="mt-1.5 h-10"
        />
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
        <select
          id="signup-access-role"
          value={role}
          onChange={(ev) => setRole(ev.target.value)}
          className="mt-1.5 flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-[13px] text-al-text-primary dark:border-neutral-600 dark:bg-neutral-950"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value || "empty"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="pointer-events-none absolute -left-[9999px] top-0 opacity-0" aria-hidden>
        <label>
          Website
          <input tabIndex={-1} type="text" name="website" value={websiteUrl} onChange={(ev) => setWebsiteUrl(ev.target.value)} />
        </label>
      </div>
      {error ? (
        <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {error}
        </p>
      ) : null}
      {!canSubmit && !busy ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="signup-access-readiness">
          Enter a work email to send your request.
        </p>
      ) : null}
      <Button type="submit" disabled={!canSubmit} variant="primary" className="w-full sm:w-auto">
        {busy ? "Sending…" : SIGNUP_INVITE_ONLY_SUBMIT_LABEL}
      </Button>
    </form>
  );
}
