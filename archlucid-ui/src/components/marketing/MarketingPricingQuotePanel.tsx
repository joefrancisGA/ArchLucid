"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

const MAX_MESSAGE_CHARS = 2000;

function buildQuoteMessageBody(
  userMessage: string,
  industry: string,
  procurementTimeline: string,
  deploymentPreference: string,
  dataSensitivity: string,
  expectedMonthlyReviewVolume: string,
): string {
  const lines: string[] = [];

  if (industry.trim().length > 0) {
    lines.push(`Industry: ${industry.trim()}`);
  }

  if (procurementTimeline.trim().length > 0) {
    lines.push(`Procurement timeline: ${procurementTimeline.trim()}`);
  }

  if (deploymentPreference.trim().length > 0) {
    lines.push(`Deployment preference: ${deploymentPreference.trim()}`);
  }

  if (dataSensitivity.trim().length > 0) {
    lines.push(`Data sensitivity: ${dataSensitivity.trim()}`);
  }

  if (expectedMonthlyReviewVolume.trim().length > 0) {
    lines.push(`Expected monthly review volume: ${expectedMonthlyReviewVolume.trim()}`);
  }

  if (lines.length > 0) {
    lines.push("");
  }

  lines.push(userMessage.trim());

  return lines.join("\n");
}

/** Anonymous quote request — POST `/v1/marketing/pricing/quote-request` via same-origin proxy. */
export function MarketingPricingQuotePanel() {
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tierInterest, setTierInterest] = useState("Professional");
  const [industry, setIndustry] = useState("");
  const [procurementTimeline, setProcurementTimeline] = useState("");
  const [deploymentPreference, setDeploymentPreference] = useState("");
  const [dataSensitivity, setDataSensitivity] = useState("");
  const [expectedMonthlyReviewVolume, setExpectedMonthlyReviewVolume] = useState("");
  const [message, setMessage] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const composed = buildQuoteMessageBody(
      message,
      industry,
      procurementTimeline,
      deploymentPreference,
      dataSensitivity,
      expectedMonthlyReviewVolume,
    );

    if (composed.length > MAX_MESSAGE_CHARS) {
      setError(`Message and optional fields combined must be at most ${MAX_MESSAGE_CHARS} characters.`);
      setBusy(false);

      return;
    }

    try {
      const res = await fetch("/api/proxy/v1/marketing/pricing/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          workEmail,
          companyName,
          tierInterest,
          message: composed,
          websiteUrl,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-testid="pricing-quote-request-section"
      id="pricing-quote-request"
      aria-labelledby="quote-request-heading"
      className="mb-10 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="quote-request-heading" className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Request a quote
      </h2>
      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        Submit your procurement details and we will respond with next steps — most teams consolidate requirements over
        email before workspace provisioning begins.
      </p>
      {done ? (
        <p className="text-sm text-teal-800 dark:text-teal-200" role="status">
          Thanks — your request was received.
        </p>
      ) : (
        <form className="space-y-3" onSubmit={(ev) => void onSubmit(ev)} noValidate>
          <div className="hidden" aria-hidden="true">
            <label htmlFor="pricing-quote-website">Website</label>
            <input
              id="pricing-quote-website"
              name="websiteUrl"
              tabIndex={-1}
              autoComplete="off"
              value={websiteUrl}
              onChange={(ev) => setWebsiteUrl(ev.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span>Work email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={workEmail}
              onChange={(ev) => setWorkEmail(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Company</span>
            <input
              required
              type="text"
              autoComplete="organization"
              value={companyName}
              onChange={(ev) => setCompanyName(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Tier interest</span>
            <select
              value={tierInterest}
              onChange={(ev) => setTierInterest(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option>Team</option>
              <option>Professional</option>
              <option>Enterprise</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Industry (optional)</span>
            <input
              type="text"
              autoComplete="off"
              value={industry}
              onChange={(ev) => setIndustry(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Procurement timeline (optional)</span>
            <input
              type="text"
              value={procurementTimeline}
              onChange={(ev) => setProcurementTimeline(ev.target.value)}
              placeholder="e.g. Q3 RFP, 90-day pilot"
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Deployment preference (optional)</span>
            <input
              type="text"
              autoComplete="off"
              value={deploymentPreference}
              onChange={(ev) => setDeploymentPreference(ev.target.value)}
              placeholder="e.g. SaaS, customer-managed, private Azure"
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Data sensitivity (optional)</span>
            <input
              type="text"
              autoComplete="off"
              value={dataSensitivity}
              onChange={(ev) => setDataSensitivity(ev.target.value)}
              placeholder="e.g. PHI, regulated financial, no regulated data in scope"
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Expected monthly review volume (optional)</span>
            <input
              type="text"
              autoComplete="off"
              value={expectedMonthlyReviewVolume}
              onChange={(ev) => setExpectedMonthlyReviewVolume(ev.target.value)}
              placeholder="e.g. 2–5 architecture reviews per month"
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Message</span>
            <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
              Add context not covered above; procurement and account teams follow up on details.
            </span>
            <textarea
              required
              maxLength={MAX_MESSAGE_CHARS}
              rows={4}
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Submit quote request"}
          </Button>
        </form>
      )}
    </section>
  );
}
