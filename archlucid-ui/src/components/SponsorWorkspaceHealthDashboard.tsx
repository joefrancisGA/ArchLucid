"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useCallback, useEffect, useState } from "react";

import { DecisionsNeededSummaryCard } from "@/components/governance/DecisionsNeededSummaryCard";
import { GovernanceBypassAuditPanel } from "@/components/governance/GovernanceBypassAuditPanel";
import { DataArchivalDegradedBanner } from "@/components/governance/DataArchivalDegradedBanner";
import { SponsorWorkspaceHealthPageHero } from "@/components/governance/SponsorWorkspaceHealthPageHero";
import { LayerHeader } from "@/components/LayerHeader";
import { TenantSystemWorkspaceHealthVocabularyRail } from "@/components/TenantSystemWorkspaceHealthVocabularyRail";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import {
  SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE,
  SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY,
} from "@/lib/sponsor-workspace-health-page-copy";
import {
  SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_OPEN_PARAM,
  parseSponsorWorkspaceHealthSessionScopeOpenFromSearch,
  sponsorWorkspaceHealthSessionScopeDisclosureHrefFromSearch,
} from "@/lib/governance/sponsor-workspace-health-session-scope-disclosure-url";
import {
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

import { SponsorWorkspaceHealthKpiBlocks } from "./SponsorWorkspaceHealthKpiBlocks";
import { useSponsorWorkspaceHealthDashboard } from "./use-sponsor-workspace-health-dashboard";

export type SponsorWorkspaceHealthDashboardProps = {
  readonly standalonePage?: boolean;
};

/**
 * Sponsor-oriented **Workspace health**: five KPI blocks composed from existing governance, audit, compliance-drift, and pilot-value APIs (current scope only).
 */
export function SponsorWorkspaceHealthDashboard({
  standalonePage = false,
}: SponsorWorkspaceHealthDashboardProps = {}) {
  const {
    buyerPolishedShell,
    callerRank,
    scopeBanner,
    isLoading,
    loadError,
    retryAll,
    decisionsNeeded,
    kpiViewModel,
  } = useSponsorWorkspaceHealthDashboard();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sponsorWorkspaceHealthSessionScopeParam = searchParams.get(SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_OPEN_PARAM);
  const [sponsorWorkspaceHealthSessionScopeOpen, setSponsorWorkspaceHealthSessionScopeOpenState] = useState(() =>
    parseSponsorWorkspaceHealthSessionScopeOpenFromSearch(sponsorWorkspaceHealthSessionScopeParam),
  );
  const syncSponsorWorkspaceHealthSessionScopeOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        sponsorWorkspaceHealthSessionScopeDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setSponsorWorkspaceHealthSessionScopeOpen = useCallback(
    (open: boolean) => {
      setSponsorWorkspaceHealthSessionScopeOpenState(open);
      syncSponsorWorkspaceHealthSessionScopeOpenToUrl(open);
    },
    [syncSponsorWorkspaceHealthSessionScopeOpenToUrl],
  );
  useEffect(() => {
    setSponsorWorkspaceHealthSessionScopeOpenState(
      parseSponsorWorkspaceHealthSessionScopeOpenFromSearch(sponsorWorkspaceHealthSessionScopeParam),
    );
  }, [sponsorWorkspaceHealthSessionScopeParam]);

  const layerHeader = (
    <LayerHeader
      pageKey="governance-dashboard"
      density={buyerPolishedShell ? "compact" : "default"}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {layerHeader}
        <SponsorWorkspaceHealthPageHero
          buyerPolishedShell={buyerPolishedShell}
          standalonePage={standalonePage}
        />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {`Loading ${SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE.toLowerCase()}…`}
        </p>
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <div className="space-y-4">
        {layerHeader}
        <SponsorWorkspaceHealthPageHero
          buyerPolishedShell={buyerPolishedShell}
          standalonePage={standalonePage}
        />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
        <OperatorApiProblem
          fallbackMessage={loadError.message}
          problem={loadError.problem}
          correlationId={loadError.correlationId}
        />
        {buyerPolishedShell ? (
          <p className={cn("m-0 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Evaluation workspaces may not expose full KPI telemetry yet. Continue from{" "}
            <Link className={OPERATOR_LINK.nav} href="/governance/approval-queue">
              Resolve outcomes workflow
            </Link>{" "}
            for approvals and promotions.
          </p>
        ) : null}
        <Button type="button" variant="secondary" onClick={retryAll}>
          Retry
        </Button>
      </div>
    );
  }

  if (kpiViewModel === null || decisionsNeeded === undefined) {
    return (
      <div className="space-y-4">
        {layerHeader}
        <SponsorWorkspaceHealthPageHero
          buyerPolishedShell={buyerPolishedShell}
          standalonePage={standalonePage}
        />
        <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {`Loading ${SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE.toLowerCase()}…`}
        </p>
      </div>
    );
  }

  const scopeBannerBlock =
    buyerPolishedShell ? (
      <details
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 shadow-sm dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.body,
        )}
        data-testid="sponsor-workspace-health-session-scope"
        open={sponsorWorkspaceHealthSessionScopeOpen}
        onToggle={(event) => setSponsorWorkspaceHealthSessionScopeOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer font-semibold text-al-text-primary dark:text-neutral-100">
          {SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY}
        </summary>
        <p className="m-0 mt-2 leading-snug" role="status">
          {scopeBanner}
        </p>
      </details>
    ) : (
      <div
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised px-4 py-3 shadow-sm dark:border-neutral-800",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
        data-testid="sponsor-workspace-health-session-scope"
      >
        <p className="m-0 font-semibold text-al-text-primary dark:text-neutral-100">
          {SPONSOR_WORKSPACE_HEALTH_SESSION_SCOPE_SUMMARY}
        </p>
        <p className="m-0 mt-1 leading-snug">{scopeBanner}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {layerHeader}

      <SponsorWorkspaceHealthPageHero
        buyerPolishedShell={buyerPolishedShell}
        standalonePage={standalonePage}
      />
      <TenantSystemWorkspaceHealthVocabularyRail currentSurfaceId="workspace-health" />
      {scopeBannerBlock}

      <DataArchivalDegradedBanner />

      <DecisionsNeededSummaryCard summary={decisionsNeeded} />

      <GovernanceBypassAuditPanel />

      <SponsorWorkspaceHealthKpiBlocks
        buyerPolishedShell={buyerPolishedShell}
        callerRank={callerRank}
        viewModel={kpiViewModel}
      />
    </div>
  );
}
