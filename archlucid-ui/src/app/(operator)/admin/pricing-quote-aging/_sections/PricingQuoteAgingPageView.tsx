"use client";

import Link from "next/link";

import { ContextualHelp } from "@/components/ContextualHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { operatorSemanticSurface } from "@/lib/design-tokens";
import { pricingQuoteAgingRowTone } from "@/lib/pricing-quote-aging";
import { acknowledgePricingQuoteRequest, closePricingQuoteRequest } from "@/lib/trial-funnel-ops";

import type { PricingQuoteAgingPageViewModel } from "./use-pricing-quote-aging-page";

type Props = {
  readonly model: PricingQuoteAgingPageViewModel;
};

function rowClassName(tone: ReturnType<typeof pricingQuoteAgingRowTone>): string {
  if (tone === "breach") {
    return operatorSemanticSurface("blocked");
  }

  if (tone === "warn") {
    return operatorSemanticSurface("warn");
  }

  return "";
}

export function PricingQuoteAgingPageView(props: Props) {
  const m = props.model;

  if (m.surface === "demo") {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">
          Pricing quote aging is not available in demo mode.
        </p>
      </div>
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="mx-auto max-w-6xl space-y-6" data-testid="pricing-quote-aging-page">
        <p className="m-0 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="mx-auto max-w-6xl space-y-6" data-testid="pricing-quote-aging-page">
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="pricing-quote-aging-forbidden">
          This page requires tenant administrator access (AdminAuthority).
        </p>
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Return to home
          </Link>
        </p>
      </div>
    );
  }

  const data = m.data;

  return (
    <div className="mx-auto max-w-6xl space-y-6" data-testid="pricing-quote-aging-page">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Pricing quote aging</h1>
          <ContextualHelp helpKey="admin-pricing-quote-aging" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Unanswered marketing quote requests with SLA posture (warn at 18h, breach at 24h). Human sales follow-up only —
          no buyer auto-replies. Escalation steps:{" "}
          <span className="font-mono text-xs">docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md</span>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={m.loading} onClick={() => void m.refresh()}>
            {m.loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-2xl font-semibold" data-testid="pricing-quote-aging-open-count">
              {data?.rows.length ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warn (≥18h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-2xl font-semibold text-amber-800 dark:text-amber-200" data-testid="pricing-quote-aging-warn-count">
              {data?.warnCount ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Breach (≥24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-2xl font-semibold text-rose-800 dark:text-rose-200" data-testid="pricing-quote-aging-breach-count">
              {data?.breachCount ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Open quote requests</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Sorted by SLA severity, then age. Source: <span className="font-mono text-xs">GET /v1/admin/marketing/pricing-quote-aging</span>.
          </p>
        </CardHeader>
        <CardContent>
          {m.error !== null ? (
            <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert">
              {m.error}
            </p>
          ) : null}
          {m.loading ? <p className="m-0 text-sm text-neutral-500">Loading…</p> : null}
          {!m.loading && data !== null && data.rows.length === 0 ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No open quote requests.</p>
          ) : null}
          {!m.loading && data !== null && data.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Age (h)</th>
                    <th className="px-2 py-2 font-medium">Created (UTC)</th>
                    <th className="px-2 py-2 font-medium">Company</th>
                    <th className="px-2 py-2 font-medium">Work email</th>
                    <th className="px-2 py-2 font-medium">Tier</th>
                    <th className="px-2 py-2 font-medium">Follow-up</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => {
                    const tone = pricingQuoteAgingRowTone(row.breachStatus);

                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-neutral-100 dark:border-neutral-900 ${rowClassName(tone)}`}
                        data-testid="pricing-quote-aging-row"
                        data-breach-status={row.breachStatus}
                      >
                        <td className="px-2 py-2 font-medium">{row.breachStatus}</td>
                        <td className="px-2 py-2">{row.ageHours.toFixed(1)}</td>
                        <td className="px-2 py-2 font-mono text-xs">{row.createdUtc}</td>
                        <td className="px-2 py-2">{row.companyName}</td>
                        <td className="px-2 py-2">{row.workEmail}</td>
                        <td className="px-2 py-2">{row.tierInterest}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void acknowledgePricingQuoteRequest(row.id).then(() => m.refresh())}
                            >
                              Acknowledge
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void closePricingQuoteRequest(row.id).then(() => m.refresh())}
                            >
                              Close
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
