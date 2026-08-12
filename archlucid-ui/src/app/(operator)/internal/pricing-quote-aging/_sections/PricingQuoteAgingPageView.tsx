"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/CollapsibleSection";

import {
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
  operatorSemanticSurface,
} from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  PRICING_QUOTE_SLA_BREACH_HOURS,
  PRICING_QUOTE_SLA_WARN_HOURS,
  buildPricingQuoteFollowUpSummaryTiles,
  extractEmailDomain,
  formatPricingQuoteAgeHours,
  formatPricingQuoteSubmittedUtc,
  pricingQuoteFollowUpHeadlineSurfaceClass,
  pricingQuoteFollowUpSummaryTileToneClass,
  pricingQuoteSlaBadgeClass,
  resolvePricingQuoteFollowUpHeadline,
  resolvePricingQuoteFollowUpStatus,
  resolvePricingQuoteLastTouchLabel,
  resolvePricingQuoteOwnerLabel,
  resolvePricingQuoteSlaBadge,
} from "@/lib/pricing-quote-follow-up-present";
import { pricingQuoteAgingRowTone, type PricingQuoteAgingRow } from "@/lib/pricing-quote-aging";
import { formatRelativeTime } from "@/lib/relative-time";
import { acknowledgePricingQuoteRequest, closePricingQuoteRequest } from "@/lib/trial-funnel-ops";

import type { PricingQuoteAgingPageViewModel } from "./use-pricing-quote-aging-page";

type Props = {
  readonly model: PricingQuoteAgingPageViewModel;
};

const TABLE_COLUMNS = [
  "Buyer / company",
  "Email / domain",
  "Plan or use case",
  "Submitted",
  "Age",
  "SLA status",
  "Owner",
  "Follow-up status",
  "Last touch",
  "Actions",
] as const;

function rowClassName(tone: ReturnType<typeof pricingQuoteAgingRowTone>): string {
  if (tone === "breach") {
    return operatorSemanticSurface("blocked");
  }

  if (tone === "warn") {
    return operatorSemanticSurface("warn");
  }

  return "";
}

async function copyWorkEmail(workEmail: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
    return;
  }

  await navigator.clipboard.writeText(workEmail);
}

function assignOwnerPrompt(): string | null {
  const owner = window.prompt("Assign an owner for this quote request (email or name):");

  if (owner === null) {
    return null;
  }

  const trimmed = owner.trim();

  if (trimmed.length === 0) {
    return null;
  }

  return trimmed;
}

type PricingQuoteFollowUpRowActionsProps = {
  readonly row: PricingQuoteAgingRow;
  readonly onActionComplete: () => Promise<void>;
};

function PricingQuoteFollowUpRowActions(props: PricingQuoteFollowUpRowActionsProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const runAction = useCallback(
    async (action: () => Promise<void>) => {
      setBusy(true);

      try {
        await action();
        await props.onActionComplete();
      } finally {
        setBusy(false);
      }
    },
    [props],
  );

  return (
    <div className="flex min-w-[12rem] flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => {
          const owner = assignOwnerPrompt();

          if (owner === null) {
            return;
          }

          void runAction(() => acknowledgePricingQuoteRequest(props.row.id, owner));
        }}
      >
        Assign owner
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void runAction(() => acknowledgePricingQuoteRequest(props.row.id))}
      >
        Mark contacted
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => {
          void copyWorkEmail(props.row.workEmail).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? "Copied" : "Copy email"}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={busy} asChild>
        <a href={`mailto:${encodeURIComponent(props.row.workEmail)}`}>Open request</a>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void runAction(() => closePricingQuoteRequest(props.row.id))}
      >
        Dismiss
      </Button>
    </div>
  );
}

export function PricingQuoteAgingPageView(props: Props) {
  const m = props.model;
  const showSupportDetails = isShowSystemAdministrationNavEnabled();

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
          Pricing quote follow-up is restricted to internal sales operations with tenant administrator access.
        </p>
      </div>
    );
  }

  const data = m.data;
  const headline = data === null ? null : resolvePricingQuoteFollowUpHeadline(data);
  const summaryTiles = data === null ? [] : buildPricingQuoteFollowUpSummaryTiles(data);
  const lastUpdatedLabel =
    m.lastRefreshedAt === null ? null : `Updated ${formatRelativeTime(m.lastRefreshedAt.toISOString())}`;

  return (
    <div className="w-full max-w-[1440px] space-y-6" data-testid="pricing-quote-aging-page">
      <OperatorPageHeader
        title="Pricing quote follow-up"
        titleTestId="pricing-quote-follow-up-title"
        subtitle="Track open pricing requests, SLA age, owner, and follow-up status."
        metadata={
          <Badge variant="outline" className="border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300">
            Internal sales operations
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PageContextualHelpButton />
            {lastUpdatedLabel !== null ? (
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="pricing-quote-follow-up-last-updated">
                {lastUpdatedLabel}
              </span>
            ) : null}
            <Button type="button" variant="outline" size="sm" disabled={m.loading} onClick={() => void m.refresh()}>
              {m.loading ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        }
      />
{headline !== null ? (
        <p
          className={cn(
            "m-0 rounded-lg border px-4 py-3 font-medium",
            OPERATOR_TYPOGRAPHY.body,
            pricingQuoteFollowUpHeadlineSurfaceClass(headline.tone),
          )}
          data-testid="pricing-quote-follow-up-headline"
        >
          {headline.message}
        </p>
      ) : null}

      {summaryTiles.length > 0 ? (
        <section className="space-y-3" data-testid="pricing-quote-follow-up-summary">
          <dl className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-5">
            {summaryTiles.map((tile) => (
              <div
                key={tile.id}
                className={cn("rounded-md border px-3 py-2", pricingQuoteFollowUpSummaryTileToneClass(tile.tone))}
                data-testid={`pricing-quote-follow-up-tile-${tile.id}`}
              >
                <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{tile.label}</dt>
                <dd className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}>
                  {tile.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <CollapsibleSection title="SLA settings" sectionTestId="pricing-quote-follow-up-sla-settings">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Manual follow-up SLAs for open pricing requests submitted through the public pricing form.
        </p>
        <dl className={cn("m-0 mt-3 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Warn threshold</dt>
            <dd className="m-0 mt-1 text-al-text-secondary">{PRICING_QUOTE_SLA_WARN_HOURS} hours without outreach</dd>
          </div>
          <div className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Breach threshold</dt>
            <dd className="m-0 mt-1 text-al-text-secondary">{PRICING_QUOTE_SLA_BREACH_HOURS} hours without outreach</dd>
          </div>
        </dl>
      </CollapsibleSection>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Open quote requests</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Requests arrive from the public pricing page quote form. Sorted by SLA severity, then age.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {m.error !== null ? (
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {m.error}
            </p>
          ) : null}

          {m.loading && data === null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading open requests…</p>
          ) : null}

          {!m.loading && data !== null && data.rows.length === 0 ? (
            <div
              className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-8 text-center dark:border-neutral-700 dark:bg-neutral-900/40"
              data-testid="pricing-quote-follow-up-empty"
            >
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                No quote requests waiting for follow-up
              </p>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                New pricing requests will appear here after buyers submit the pricing form.
              </p>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Manual follow-up remains required before any buyer communication is sent.
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className={cn("w-full min-w-[1080px] border-collapse text-left", OPERATOR_TYPOGRAPHY.body)}>
              <thead>
                <tr className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
                  {TABLE_COLUMNS.map((column) => (
                    <th key={column} className="px-2 py-2">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!m.loading && data !== null && data.rows.length > 0
                  ? data.rows.map((row) => {
                      const tone = pricingQuoteAgingRowTone(row.breachStatus);
                      const slaBadge = resolvePricingQuoteSlaBadge(row);

                      return (
                        <tr
                          key={row.id}
                          className={`border-b border-neutral-100 dark:border-neutral-900 ${rowClassName(tone)}`}
                          data-testid="pricing-quote-aging-row"
                          data-breach-status={row.breachStatus}
                        >
                          <td className="px-2 py-2">
                            <div className="font-medium text-al-text-primary">{row.companyName || "—"}</div>
                          </td>
                          <td className="px-2 py-2">
                            <div>{row.workEmail}</div>
                            <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                              {extractEmailDomain(row.workEmail)}
                            </div>
                          </td>
                          <td className="px-2 py-2">{row.tierInterest || "—"}</td>
                          <td className={cn("px-2 py-2", OPERATOR_TYPOGRAPHY.micro)}>
                            {formatPricingQuoteSubmittedUtc(row.createdUtc)}
                          </td>
                          <td className="px-2 py-2">{formatPricingQuoteAgeHours(row.ageHours)}</td>
                          <td className="px-2 py-2">
                            <Badge variant="outline" className={pricingQuoteSlaBadgeClass(slaBadge)}>
                              {slaBadge}
                            </Badge>
                          </td>
                          <td className="px-2 py-2">{resolvePricingQuoteOwnerLabel(row)}</td>
                          <td className="px-2 py-2">{resolvePricingQuoteFollowUpStatus(row)}</td>
                          <td className="px-2 py-2">{resolvePricingQuoteLastTouchLabel(row)}</td>
                          <td className="px-2 py-2">
                            <PricingQuoteFollowUpRowActions row={row} onActionComplete={m.refresh} />
                          </td>
                        </tr>
                      );
                    })
                  : null}
                {!m.loading && data !== null && data.rows.length === 0 ? (
                  <tr data-testid="pricing-quote-follow-up-empty-row">
                    <td className="px-2 py-6 text-center text-al-text-secondary" colSpan={TABLE_COLUMNS.length}>
                      No rows to display.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showSupportDetails ? (
        <CollapsibleSection title="Support details" sectionTestId="pricing-quote-follow-up-support-details">
          <dl className={cn("m-0 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <div>
              <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>API route</dt>
              <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>GET /v1/admin/marketing/pricing-quote-aging</dd>
            </div>
            <div>
              <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Runbook</dt>
              <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>MARKETING_PRICING_QUOTE_NOTIFICATIONS.md</dd>
            </div>
          </dl>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
