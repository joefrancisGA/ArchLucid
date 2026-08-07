"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { resolveDigestNextBestAction } from "@/lib/digest-setup-gap-actions";
import { digestHashFragment } from "@/lib/digests-browse-deep-link";
import {
  DIGESTS_PRIVACY_DETAILS_TRIGGER,
  DIGESTS_PRIVACY_NOTE,
  DIGESTS_SCHEDULE_PREVIEW_LABEL,
  digestsBrowsePageSubtitle,
  digestsSchedulePageSubtitle,
} from "@/lib/digests-browse-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  DIGESTS_BROWSE_TAB_RESPONSIBILITY,
  DIGESTS_SCHEDULE_TAB_RESPONSIBILITY,
  DIGESTS_SUBSCRIPTIONS_TAB_RESPONSIBILITY,
} from "@/lib/exec-digest-schedule-page-model";
import { DIGESTS_HUB_TAB_IDS, type DigestsHubTabId } from "@/lib/digests-hub-tab";
import {
  digestsHubNavigationPathname,
  digestsHubTabFromLocation,
} from "@/lib/digests-route-paths";
import {
  digestsListRefreshButtonTitleOperator,
  digestsListRefreshButtonTitleReader,
} from "@/lib/enterprise-controls-context-copy";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

import { DigestsBrowseContent } from "./DigestsBrowseContent";
import { DigestSubscriptionsContent } from "./DigestSubscriptionsContent";
import { DigestsScheduleEvidenceOrientationStrip } from "./DigestsScheduleEvidenceOrientationStrip";
import { DigestsSourcesStrip } from "./DigestsSourcesStrip";
import { ExecDigestScheduleContent } from "./ExecDigestScheduleContent";
import { DigestsPageHeader } from "./DigestsPageHeader";
import { WeeklyDigestHealthBanner } from "./WeeklyDigestHealthBanner";

const TAB_PARAM = "tab";

const TAB_LABEL: Record<DigestsHubTabId, string> = {
  browse: "Browse",
  subscriptions: "Subscriptions",
  schedule: "Schedule",
};

const TAB_RESPONSIBILITY: Record<DigestsHubTabId, string> = {
  browse: DIGESTS_BROWSE_TAB_RESPONSIBILITY,
  subscriptions: DIGESTS_SUBSCRIPTIONS_TAB_RESPONSIBILITY,
  schedule: DIGESTS_SCHEDULE_TAB_RESPONSIBILITY,
};

const SUBSCRIPTIONS_TAB_READER_TITLE =
  "List is readable at Read rank; creating or changing subscriptions requires a role that can manage digests.";
const SCHEDULE_TAB_READER_TITLE =
  "Schedule is readable; saving or enabling delivery requires a role that can manage digests.";

const PREVIEW_LATEST_TITLE = "Opens the most recently generated digest summary.";

/**
 * Single `/digests` surface: browse, subscriptions, and executive digest schedule. Tab state in `?tab=` for deep links.
 */
export function DigestsHubClient(): ReactElement {
  const router: ReturnType<typeof useRouter> = useRouter();
  const pathname: string = usePathname();
  const searchParams = useSearchParams();
  const canMutate: boolean = useOperateCapability();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
  const previewHref: string = `${pathname}?${TAB_PARAM}=browse${digestHashFragment(previewDigestId)}`;

  /**
   * One primary job per page (TB-1539): the next unresolved setup step while the
   * loop is incomplete, otherwise reading the latest digest. The Browse setup
   * checklist owns the full step list, so the header never repeats it.
   */
  const nextBestAction = healthSnap !== null ? resolveDigestNextBestAction(healthSnap) : null;
  const previewIsPrimary: boolean = nextBestAction === null && hasPreviewDigest;

  const pageSubtitle: string =
    activeTab === "schedule"
      ? digestsSchedulePageSubtitle(buyerPolishedShell)
      : digestsBrowsePageSubtitle(buyerPolishedShell);
  const showBrowseHeaderActions: boolean = activeTab === "browse";

  const browseHeaderActions =
    showBrowseHeaderActions ? (
      <>
        {nextBestAction !== null ? (
          <Button asChild size="sm" variant="primary" data-testid="digests-primary-action">
            <Link href={nextBestAction.href}>{nextBestAction.actionLabel}</Link>
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

  return (
    <div className="px-0" data-testid="digests-hub">
      <DigestsPageHeader
        subtitle={pageSubtitle}
        refreshing={refreshing}
        lastUpdatedUtc={lastUpdatedUtc}
        onRefresh={onRefresh}
        refreshButtonTitle={
          canMutate ? digestsListRefreshButtonTitleOperator : digestsListRefreshButtonTitleReader
        }
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
            const tabTitle: string = readerTitle ?? TAB_RESPONSIBILITY[id];

            return (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`digests-hub-tab-${id}`}
                title={tabTitle}
              >
                {TAB_LABEL[id]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {activeTab === "schedule" ? (
          <div className="mt-4">
            <DigestsScheduleEvidenceOrientationStrip />
          </div>
        ) : (
          <DigestsSourcesStrip />
        )}

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
          />
        )}

        {activeTab !== "subscriptions" && activeTab !== "schedule" ? (
          buyerPolishedShell ? (
            <CollapsibleSection
              title={DIGESTS_PRIVACY_DETAILS_TRIGGER}
              defaultOpen={false}
              sectionTestId="digests-privacy-details"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{DIGESTS_PRIVACY_NOTE}</p>
            </CollapsibleSection>
          ) : (
            <p
              className={cn(
                "mb-4 m-0 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
                OPERATOR_TYPOGRAPHY.helper,
              )}
              data-testid="digests-privacy-note"
            >
              {DIGESTS_PRIVACY_NOTE}
            </p>
          )
        ) : null}

        <TabsContent value="browse" className="mt-4" data-testid="digests-hub-panel">
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
