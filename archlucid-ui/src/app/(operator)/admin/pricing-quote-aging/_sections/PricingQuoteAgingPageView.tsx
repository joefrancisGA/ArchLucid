"use client";

import Link from "next/link";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
  operatorSemanticSurface,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
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
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Pricing quote follow-up"
        description="In a connected internal operator build, staff track open quote requests and follow-up SLA status here."
      />
    );
  }

  if (m.surface === "authority_loading") {
    return (
      <div className="w-full max-w-[1440px] space-y-6" data-testid="pricing-quote-aging-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </div>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <div className="w-full max-w-[1440px] space-y-6" data-testid="pricing-quote-aging-page">
        <p
          className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
          data-testid="pricing-quote-aging-forbidden"
        >
          This page requires tenant administrator access (AdminAuthority).
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <Link className={OPERATOR_LINK.inline} href="/">
            Return to home
          </Link>
        </p>
      </div>
    );
  }

  const data = m.data;

  return (
    <div className="w-full max-w-[1440px] space-y-6" data-testid="pricing-quote-aging-page">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Pricing quote follow-up</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Track open pricing quote requests and follow-up SLA status. Sales follow-up is manual — no automated buyer
          replies.
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
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Open requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`m-0 ${OPERATOR_TYPOGRAPHY.kpiValue}`} data-testid="pricing-quote-aging-open-count">
              {data?.rows.length ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Warn threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue, "text-amber-800 dark:text-amber-200")}
              data-testid="pricing-quote-aging-warn-count"
            >
              {data?.warnCount ?? "—"}
              <span className={cn("ml-1 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>(18 hours)</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Breach threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn("m-0", OPERATOR_TYPOGRAPHY.kpiValue, "text-rose-800 dark:text-rose-200")}
              data-testid="pricing-quote-aging-breach-count"
            >
              {data?.breachCount ?? "—"}
              <span className={cn("ml-1 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>(24 hours)</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Open requests</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Sorted by SLA severity, then age.
          </p>
        </CardHeader>
        <CardContent>
          {m.error !== null ? (
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {m.error}
            </p>
          ) : null}
          {m.loading ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p> : null}
          {!m.loading && data !== null && data.rows.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No open quote requests.</p>
          ) : null}
          {!m.loading && data !== null && data.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full min-w-[720px] border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Age (h)</th>
                    <th className="px-2 py-2">Created (UTC)</th>
                    <th className="px-2 py-2">Company</th>
                    <th className="px-2 py-2">Work email</th>
                    <th className="px-2 py-2">Tier</th>
                    <th className="px-2 py-2">Follow-up</th>
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
                        <td className={cn("px-2 py-2 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                          {row.createdUtc}
                        </td>
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

      <CollapsibleSection title="Technical details" sectionTestId="pricing-quote-aging-technical-details">
        <dl className={cn("m-0 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Source</dt>
            <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>GET /v1/admin/marketing/pricing-quote-aging</dd>
          </div>
          <div>
            <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Runbook</dt>
            <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>MARKETING_PRICING_QUOTE_NOTIFICATIONS.md</dd>
          </div>
        </dl>
      </CollapsibleSection>
    </div>
  );
}
