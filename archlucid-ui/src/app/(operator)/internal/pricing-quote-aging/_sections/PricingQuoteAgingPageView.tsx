"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { PricingQuoteAgingEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

import {
  OPERATOR_LAYOUT,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
  operatorSemanticSurface,
} from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { INTERNAL_PRICING_QUOTE_AGING_PATH } from "@/lib/internal-ops-route-paths";
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
import {
  parsePricingQuoteSlaSettingsOpenFromSearch,
  pricingQuoteSlaSettingsDisclosureHrefFromSearch,
} from "@/lib/internal/pricing-quote-sla-settings-disclosure-url";
import {
  parsePricingQuoteSupportDetailsOpenFromSearch,
  pricingQuoteSupportDetailsDisclosureHrefFromSearch,
} from "@/lib/internal/pricing-quote-support-details-disclosure-url";

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
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_PRICING_QUOTE_AGING_PATH;
  const searchParams = useSearchParams();
  const pricingQuoteSlaSettingsOpenParam = searchParams.get("pricingQuoteSlaSettingsOpen");
  const pricingQuoteSupportDetailsOpenParam = searchParams.get("pricingQuoteSupportDetailsOpen");
  const [slaSettingsOpen, setSlaSettingsOpenState] = useState(() =>
    parsePricingQuoteSlaSettingsOpenFromSearch(pricingQuoteSlaSettingsOpenParam),
  );
  const [supportDetailsOpen, setSupportDetailsOpenState] = useState(() =>
    parsePricingQuoteSupportDetailsOpenFromSearch(pricingQuoteSupportDetailsOpenParam),
  );
  const showSupportDetails = isShowSystemAdministrationNavEnabled();

  const syncSlaSettingsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(pricingQuoteSlaSettingsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSlaSettingsOpen = useCallback(
    (open: boolean) => {
      setSlaSettingsOpenState(open);
      syncSlaSettingsOpenToUrl(open);
    },
    [syncSlaSettingsOpenToUrl],
  );

  const syncSupportDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(pricingQuoteSupportDetailsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSupportDetailsOpen = useCallback(
    (open: boolean) => {
      setSupportDetailsOpenState(open);
      syncSupportDetailsOpenToUrl(open);
    },
    [syncSupportDetailsOpenToUrl],
  );

  useEffect(() => {
    setSlaSettingsOpenState(parsePricingQuoteSlaSettingsOpenFromSearch(pricingQuoteSlaSettingsOpenParam));
  }, [pricingQuoteSlaSettingsOpenParam]);

  useEffect(() => {
    setSupportDetailsOpenState(parsePricingQuoteSupportDetailsOpenFromSearch(pricingQuoteSupportDetailsOpenParam));
  }, [pricingQuoteSupportDetailsOpenParam]);

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
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="pricing-quote-aging-page">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      </OperatorPageContainer>
    );
  }

  if (m.surface === "forbidden") {
    return (
      <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="pricing-quote-aging-page">
        <p
          className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)}
          role="alert"
          data-testid="pricing-quote-aging-forbidden"
        >
          Pricing quote follow-up is restricted to internal sales operations with tenant administrator access.
        </p>
      </OperatorPageContainer>
    );
  }

  const data = m.data;
  const headline = data === null ? null : resolvePricingQuoteFollowUpHeadline(data);
  const summaryTiles = data === null ? [] : buildPricingQuoteFollowUpSummaryTiles(data);
  const lastUpdatedLabel =
    m.lastRefreshedAt === null ? null : `Updated ${formatRelativeTime(m.lastRefreshedAt.toISOString())}`;

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="pricing-quote-aging-page">
      <OperatorPageHeader
        navHref={INTERNAL_PRICING_QUOTE_AGING_PATH}
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
            <RefreshButton busy={m.loading} onClick={() => void m.refresh()} />
          </div>
        }
      />
      <PricingQuoteAgingEvidenceOrientationStrip />
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

      <CollapsibleSection
        title="SLA settings"
        sectionTestId="pricing-quote-follow-up-sla-settings"
        open={slaSettingsOpen}
        onToggle={setSlaSettingsOpen}
      >
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
              className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/80 px-4 py-6 text-center dark:border-neutral-700 dark:bg-neutral-900/40"
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

          <EnterpriseTable
            ariaLabel="Pricing quote follow-up queue"
            className={cn("min-w-[1080px] text-left", OPERATOR_TYPOGRAPHY.body)}
          >
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow className={cn("border-b border-neutral-200 dark:border-neutral-800", OPERATOR_NAV_GROUP_LABEL)}>
                {TABLE_COLUMNS.map((column) => (
                  <EnterpriseTableHeaderCell key={column}>{column}</EnterpriseTableHeaderCell>
                ))}
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {!m.loading && data !== null && data.rows.length > 0
                ? data.rows.map((row) => {
                    const tone = pricingQuoteAgingRowTone(row.breachStatus);
                    const slaBadge = resolvePricingQuoteSlaBadge(row);

                    return (
                      <EnterpriseTableRow
                        key={row.id}
                        className={rowClassName(tone)}
                        data-testid="pricing-quote-aging-row"
                        data-breach-status={row.breachStatus}
                      >
                        <EnterpriseTableCell>
                          <div className="font-medium text-al-text-primary">{row.companyName || " — "}</div>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <div>{row.workEmail}</div>
                          <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                            {extractEmailDomain(row.workEmail)}
                          </div>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>{row.tierInterest || " — "}</EnterpriseTableCell>
                        <EnterpriseTableCell className={OPERATOR_TYPOGRAPHY.micro}>
                          {formatPricingQuoteSubmittedUtc(row.createdUtc)}
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>{formatPricingQuoteAgeHours(row.ageHours)}</EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <Badge variant="outline" className={pricingQuoteSlaBadgeClass(slaBadge)}>
                            {slaBadge}
                          </Badge>
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>{resolvePricingQuoteOwnerLabel(row)}</EnterpriseTableCell>
                        <EnterpriseTableCell>{resolvePricingQuoteFollowUpStatus(row)}</EnterpriseTableCell>
                        <EnterpriseTableCell>{resolvePricingQuoteLastTouchLabel(row)}</EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <PricingQuoteFollowUpRowActions row={row} onActionComplete={m.refresh} />
                        </EnterpriseTableCell>
                      </EnterpriseTableRow>
                    );
                  })
                : null}
              {!m.loading && data !== null && data.rows.length === 0 ? (
                <EnterpriseTableRow data-testid="pricing-quote-follow-up-empty-row">
                  <EnterpriseTableCell className="py-6 text-center text-al-text-secondary" colSpan={TABLE_COLUMNS.length}>
                    No rows to display.
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ) : null}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </CardContent>
      </Card>

      {showSupportDetails ? (
        <CollapsibleSection
          title="Support details"
          sectionTestId="pricing-quote-follow-up-support-details"
          open={supportDetailsOpen}
          onToggle={setSupportDetailsOpen}
        >
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
    </OperatorPageContainer>
  );
}
