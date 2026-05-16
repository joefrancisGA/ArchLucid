"use client";

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

/**
 * Tertiary hero capture — not tenant signup; no instant product access messaging.
 */
export function HeroEarlyAccessCta() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
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
        source: "hero",
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
        className="mx-auto mt-4 max-w-md text-center text-sm text-neutral-700 dark:text-neutral-300"
        data-testid="welcome-early-access-thanks"
      >
        {THANKS_COPY}
      </p>
    );
  }

  return (
    <div className="mx-auto mt-4 flex w-full max-w-md flex-col items-center gap-3">
      {open ? null : (
        <Button type="button" variant="ghost" size="sm" className="text-teal-800 dark:text-teal-200" onClick={() => setOpen(true)}>
          Join early access
        </Button>
      )}

      {open ? (
        <form
          onSubmit={(ev) => void onSubmit(ev)}
          className="w-full rounded-lg border border-neutral-200 bg-white p-4 text-left shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
          aria-label="Early access request"
        >
          <p className="mb-3 text-xs text-neutral-600 dark:text-neutral-400">
            Request a conversation—this is not instant product access, checkout, or the same as a walkthrough-led pilot.
          </p>
          <label className="flex flex-col gap-1 text-sm">
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
          <label className="mt-3 flex flex-col gap-1 text-sm">
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
          <label className="mt-3 flex flex-col gap-1 text-sm">
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
            <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="submit" disabled={busy} size="sm">
              {busy ? "Sending…" : "Submit"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
