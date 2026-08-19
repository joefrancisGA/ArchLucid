"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { extractEmailDomainForAnalytics } from "@/lib/marketing/extract-email-domain-for-analytics";
import { recordMarketingCtaEarlyAccessSubmit } from "@/lib/marketing/marketing-clarity-custom-event";

const THANKS_COPY = "Thanks! Our team will follow up within 2 business days.";

const ROLE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: "", label: "Role (optional)" },
  { value: "architect", label: "Architect / engineer" },
  { value: "engineering_lead", label: "Engineering lead" },
  { value: "product_program", label: "Product / program" },
  { value: "procurement_it", label: "Procurement / IT" },
  { value: "security_risk", label: "Security / risk" },
  { value: "other", label: "Other" },
];

export type HeroEarlyAccessCtaProps = {
  /** Clarity dimension {@code cta_source} (default {@code hero}). */
  readonly source?: string;
  readonly className?: string;
  /** When true, show the form immediately (invite-only `/signup`). */
  readonly defaultOpen?: boolean;
  readonly intro?: string;
  readonly submitLabel?: string;
  readonly thanksCopy?: string;
  readonly openButtonLabel?: string;
};

/**
 * Tertiary hero capture — not tenant signup; no instant product access messaging.
 */
export function HeroEarlyAccessCta(props: HeroEarlyAccessCtaProps) {
  const source = props.source ?? "hero";
  const className = props.className;
  const defaultOpen = props.defaultOpen === true;
  const intro =
    props.intro ??
    "Request a conversation—this is not instant product access, checkout, or the same as a walkthrough-led pilot.";
  const submitLabel = props.submitLabel ?? "Submit";
  const thanksCopy = props.thanksCopy ?? THANKS_COPY;
  const openButtonLabel = props.openButtonLabel ?? "Join early access";
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
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
        source,
        email_domain: extractEmailDomainForAnalytics(email),
        utm_source: searchParams.get("utm_source") ?? undefined,
        utm_medium: searchParams.get("utm_medium") ?? undefined,
        utm_campaign: searchParams.get("utm_campaign") ?? undefined,
      });

      setDone(true);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p
        className={cn("mx-auto mt-4 max-w-md text-center text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
        data-testid="welcome-early-access-thanks"
      >
        {thanksCopy}
      </p>
    );
  }

  const canCancel = !defaultOpen;

  return (
    <div className={cn("mx-auto mt-4 flex w-full max-w-md flex-col items-center gap-3", className)}>
      {open ? null : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("font-medium text-teal-800 dark:text-teal-200", OPERATOR_TYPOGRAPHY.body)}
          onClick={() => setOpen(true)}
        >
          {openButtonLabel}
        </Button>
      )}

      {open ? (
        <form
          onSubmit={(ev) => void onSubmit(ev)}
          className="relative w-full rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          aria-label="Early access request"
          data-testid="early-access-request-form"
        >
          <p className={cn("mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{intro}</p>
          <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <span>Work email</span>
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={320}
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
            />
          </label>
          <label className={cn("mt-3 flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <span>Company (optional)</span>
            <input
              type="text"
              autoComplete="organization"
              maxLength={200}
              value={companyName}
              onChange={(ev) => setCompanyName(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
            />
          </label>
          <label className={cn("mt-3 flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
            <span>Role</span>
            <select
              value={role}
              onChange={(ev) => setRole(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-950"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value || "empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="pointer-events-none absolute -left-[9999px] top-0 opacity-0" aria-hidden>
            <label>
              Website
              <input tabIndex={-1} type="text" name="website" value={websiteUrl} onChange={(ev) => setWebsiteUrl(ev.target.value)} />
            </label>
          </div>
          {error ? (
            <p className={cn("mt-3 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || email.trim().length === 0} size="sm" variant="primary">
              {busy ? "Sending…" : submitLabel}
            </Button>
            {canCancel ? (
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
