"use client";

import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  buildDigestSetupChecklistItems,
  digestSetupHasIncompleteActionableStep,
  hasGeneratedDigestHistory,
  resolveDigestNextBestAction,
} from "@/lib/digest-setup-gap-actions";
import { digestHashFragment } from "@/lib/digests-browse-deep-link";
import {
  DIGESTS_HEALTH_CHECK_PREFIX,
  DIGESTS_PRIVACY_NOTE,
  DIGESTS_SCHEDULE_PREVIEW_LABEL,
  DIGESTS_SCHEDULE_TAB_LABEL,
  digestsBrowsePageSubtitle,
  digestsBrowseTabLabel,
  digestsSchedulePageSubtitle,
} from "@/lib/digests-browse-copy";
import {
  DIGESTS_BROWSE_TAB_GET_STARTED_RESPONSIBILITY,
  DIGESTS_BROWSE_TAB_RESPONSIBILITY,
  DIGESTS_SCHEDULE_TAB_RESPONSIBILITY,
  DIGESTS_SUBSCRIPTIONS_TAB_RESPONSIBILITY,
} from "@/lib/exec-digest-schedule-page-model";
import { DIGESTS_HUB_TAB_IDS, DIGESTS_HUB_GET_STARTED_TAB_ID, LEGACY_DIGESTS_HUB_BROWSE_TAB_ID, type DigestsHubTabId } from "@/lib/digests-hub-tab";
import {
  digestsHubNavigationPathname,
  digestsHubTabFromLocation,
  digestsHubTabPath,
} from "@/lib/digests-route-paths";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import { DigestsAdvisoryScansVocabularyRail } from "@/components/DigestsAdvisoryScansVocabularyRail";
import { DigestsBrowseScheduleSubscriptionsVocabularyRail } from "@/components/DigestsBrowseScheduleSubscriptionsVocabularyRail";
import { DigestsNotificationsVocabularyRail } from "@/components/DigestsNotificationsVocabularyRail";
import { DigestsTeamsSlackVocabularyRail } from "@/components/DigestsTeamsSlackVocabularyRail";

import { DigestsBrowseContent } from "./DigestsBrowseContent";
import { DigestSubscriptionsContent } from "./DigestSubscriptionsContent";
import { ExecDigestScheduleContent } from "./ExecDigestScheduleContent";
import { DigestsPageHeader } from "./DigestsPageHeader";
import { WeeklyDigestHealthBanner } from "./WeeklyDigestHealthBanner";

const TAB_PARAM = "tab";

const SUBSCRIPTIONS_TAB_READER_TITLE =
  "List is readable at Read rank; creating or changing subscriptions requires a role that can manage digests.";
const SCHEDULE_TAB_READER_TITLE =
  "Executive schedule is readable; saving or enabling delivery requires a role that can manage digests.";

const PREVIEW_LATEST_TITLE = "Opens the most recently generated digest summary.";

function browseTabResponsibility(hasDigestHistory: boolean): string {
  return hasDigestHistory ? DIGESTS_BROWSE_TAB_RESPONSIBILITY : DIGESTS_BROWSE_TAB_GET_STARTED_RESPONSIBILITY;
}

/**
 * Single `/digests` surface: browse, subscriptions, and executive digest schedule. Tab state in `?tab=` for deep links.
 */
export function DigestsHubClient(): ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router: ReturnType<typeof useRouter> = useRouter();
  const pathname: string = usePathname();
  const searchParams = useSearchParams();
  const canMutate: boolean = useOperateCapability();
  const rawTab: string | null = searchParams.get(TAB_PARAM);

  const [healthSnap, setHealthSnap] = useState<WeeklyDigestHealthDto | null>(null);
  const [healthRefreshToken, setHealthRefreshToken] = useState(0);
  const [browseRefreshToken, setBrowseRefreshToken] = useState(0);
  const [scheduleRefreshToken, setScheduleRefreshToken] = useState(0);
  const [lastUpdatedUtc, setLastUpdatedUtc] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const hubPathname = useMemo(() => digestsHubNavigationPathname(pathname), [pathname]);
  const activeTab: DigestsHubTabId = useMemo(
    () => digestsHubTabFromLocation(pathname, rawTab),
    [pathname, rawTab],
  );

  const hasDigestHistory: boolean =
    healthSnap !== null ? hasGeneratedDigestHistory(healthSnap) : false;

  const browseSetupChecklistIncomplete: boolean =
    healthSnap !== null
      ? digestSetupHasIncompleteActionableStep(
          buildDigestSetupChecklistItems(healthSnap, hasDigestHistory),
        )
      : false;

  const browseSetupGuidesChecklist: boolean =
    activeTab === DIGESTS_HUB_GET_STARTED_TAB_ID && browseSetupChecklistIncomplete;

  useEffect(() => {
    if (rawTab !== LEGACY_DIGESTS_HUB_BROWSE_TAB_ID) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, DIGESTS_HUB_GET_STARTED_TAB_ID);
    const hash = typeof window !== "undefined" ? window.location.hash : "";

    router.replace(`${hubPathname}?${params.toString()}${hash}`);
  }, [rawTab, searchParams, hubPathname, router]);

  // Always carry `?tab=` so shared and traffic deep links survive tab selection (TB-1505).
  const onSelectTab = useCallback(
    (id: string) => {
      const tabId: DigestsHubTabId = digestsHubTabFromLocation(hubPathname, id);

      router.push(`${hubPathname}?${TAB_PARAM}=${encodeURIComponent(tabId)}`);
    },
    [hubPathname, router],
  );

  const onHealthLoaded = useCallback((snap: WeeklyDigestHealthDto | null) => {
    setHealthSnap(snap);
    setLastUpdatedUtc(new Date().toISOString());
    setRefreshing(false);
  }, []);

  const onBrowseLoaded = useCallback(() => {
    setLastUpdatedUtc(new Date().toISOString());
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHealthRefreshToken((n) => n + 1);
    setBrowseRefreshToken((n) => n + 1);
    setScheduleRefreshToken((n) => n + 1);
  }, []);

  const healthBannerVariant =
    activeTab === "subscriptions" ? "subscriptions" : activeTab === "schedule" ? "schedule" : "full";

  const latestDigestId: string | null | undefined = healthSnap?.latestArchitectureDigestId;
  const previewDigestId = latestDigestId?.trim() ?? "";
  const hasPreviewDigest: boolean = previewDigestId !== "";
  const previewHref: string = `${digestsHubTabPath(DIGESTS_HUB_GET_STARTED_TAB_ID)}${digestHashFragment(previewDigestId)}`;

  /**
   * One primary job per page (TB-1539): preview when configured, or the next setup
   * step only when the Browse checklist is not already guiding setup.
   */
  const nextBestAction = healthSnap !== null ? resolveDigestNextBestAction(healthSnap) : null;
  const showHeaderSetupAction: boolean = nextBestAction !== null && !browseSetupGuidesChecklist;
  const previewIsPrimary: boolean = !showHeaderSetupAction && hasPreviewDigest;

  const pageSubtitle: string =
    activeTab === "schedule"
      ? digestsSchedulePageSubtitle(buyerPolishedShell)
      : digestsBrowsePageSubtitle(buyerPolishedShell);
  const showBrowseHeaderActions: boolean = activeTab === DIGESTS_HUB_GET_STARTED_TAB_ID;

  const browseHeaderActions =
    showBrowseHeaderActions && (showHeaderSetupAction || hasPreviewDigest) ? (
      <>
        {showHeaderSetupAction ? (
          <Button asChild size="sm" variant="primary" data-testid="digests-primary-action">
            <Link href={nextBestAction!.href}>{nextBestAction!.actionLabel}</Link>
          </Button>
        ) : null}
        {hasPreviewDigest ? (
          <Button
            asChild
            size="sm"
            variant={previewIsPrimary ? "primary" : "outline"}
            data-testid="digests-preview-action"
            title={PREVIEW_LATEST_TITLE}
          >
            <Link href={previewHref}>{DIGESTS_SCHEDULE_PREVIEW_LABEL}</Link>
          </Button>
        ) : null}
      </>
    ) : null;

  const tabLabel = (id: DigestsHubTabId): string => {
    if (id === DIGESTS_HUB_GET_STARTED_TAB_ID) {
      return digestsBrowseTabLabel(hasDigestHistory);
    }

    if (id === "schedule") {
      return DIGESTS_SCHEDULE_TAB_LABEL;
    }

    return "Subscriptions";
  };

  const tabResponsibility = (id: DigestsHubTabId): string => {
    if (id === DIGESTS_HUB_GET_STARTED_TAB_ID) {
      return browseTabResponsibility(hasDigestHistory);
    }

    if (id === "schedule") {
      return DIGESTS_SCHEDULE_TAB_RESPONSIBILITY;
    }

    return DIGESTS_SUBSCRIPTIONS_TAB_RESPONSIBILITY;
  };

  return (
    <div className="px-0" data-testid="digests-hub">
      <DigestsPageHeader
        subtitle={pageSubtitle}
        refreshing={refreshing}
        lastUpdatedUtc={lastUpdatedUtc}
        onRefresh={onRefresh}
        lastUpdatedPrefix={browseSetupGuidesChecklist ? DIGESTS_HEALTH_CHECK_PREFIX : undefined}
        actions={browseHeaderActions}
      />

      {/* Tabs sit immediately under the header so hub navigation precedes orientation chrome. */}
      <Tabs value={activeTab} onValueChange={onSelectTab} className="mb-4">
        <TabsList aria-label="Digest hub sections" data-testid="digests-hub-tablist">
          {DIGESTS_HUB_TAB_IDS.map((id) => {
            const readerTitle: string | undefined =
              !canMutate && id === "subscriptions"
                ? SUBSCRIPTIONS_TAB_READER_TITLE
                : !canMutate && id === "schedule"
                  ? SCHEDULE_TAB_READER_TITLE
                  : undefined;
            const tabTitle: string = readerTitle ?? tabResponsibility(id);

            return (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`digests-hub-tab-${id}`}
                title={tabTitle}
              >
                {tabLabel(id)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {activeTab === "subscriptions" ? (
          <DigestsBrowseScheduleSubscriptionsVocabularyRail currentSurfaceId="subscriptions" />
        ) : (
          <>
            <DigestsNotificationsVocabularyRail currentSurfaceId="digests" />
            <DigestsTeamsSlackVocabularyRail currentSurfaceId="digests" />
            <DigestsAdvisoryScansVocabularyRail currentSurfaceId="digests" />
            <DigestsBrowseScheduleSubscriptionsVocabularyRail currentSurfaceId={activeTab} />
          </>
        )}

        {activeTab === "schedule" ? (
          <DigestRecurrenceScheduleVocabularyRail currentSurfaceId="digest-executive-schedule" />
        ) : null}

        {activeTab === "schedule" ? (
          <WeeklyDigestHealthBanner
            refreshToken={healthRefreshToken}
            onHealthLoaded={onHealthLoaded}
            variant="schedule"
            loadOnly
          />
        ) : (
          <WeeklyDigestHealthBanner
            refreshToken={healthRefreshToken}
            onHealthLoaded={onHealthLoaded}
            variant={healthBannerVariant}
            suppressCompactFacts={browseSetupGuidesChecklist || activeTab === "subscriptions"}
          />
        )}

        {activeTab === DIGESTS_HUB_GET_STARTED_TAB_ID && !browseSetupGuidesChecklist ? (
          <p
            className={cn(
              "mb-4 m-0 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid="digests-privacy-note"
          >
            {DIGESTS_PRIVACY_NOTE}
          </p>
        ) : null}

        <TabsContent value={DIGESTS_HUB_GET_STARTED_TAB_ID} className="mt-4" data-testid="digests-hub-panel">
          <DigestsBrowseContent
            refreshToken={browseRefreshToken}
            onLoaded={onBrowseLoaded}
            hidePageHeader
            healthSnap={healthSnap}
          />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <DigestSubscriptionsContent healthSnap={healthSnap} refreshToken={healthRefreshToken} />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <ExecDigestScheduleContent
            refreshToken={scheduleRefreshToken}
            healthSnap={healthSnap}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
