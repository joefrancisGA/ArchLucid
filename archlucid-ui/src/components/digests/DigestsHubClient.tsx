"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  digestsHaveExistingConfiguration,
} from "@/lib/digest-setup-gap-actions";
import { DIGESTS_HUB_TAB_IDS, digestsHubTabFromSearchParam, type DigestsHubTabId } from "@/lib/digests-hub-tab";
import {
  digestsListRefreshButtonTitleOperator,
  digestsListRefreshButtonTitleReader,
} from "@/lib/enterprise-controls-context-copy";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

import { DigestsBrowseContent } from "./DigestsBrowseContent";
import { DigestSubscriptionsContent } from "./DigestSubscriptionsContent";
import { ExecDigestScheduleContent } from "./ExecDigestScheduleContent";
import { WeeklyDigestHealthBanner } from "./WeeklyDigestHealthBanner";

const TAB_PARAM = "tab";

const TAB_LABEL: Record<DigestsHubTabId, string> = {
  browse: "Browse",
  subscriptions: "Subscriptions",
  schedule: "Schedule",
};

const SUBSCRIPTIONS_TAB_READER_TITLE =
  "List is readable at Read rank; creating or changing subscriptions requires operator (Execute) access.";
const SCHEDULE_TAB_READER_TITLE =
  "Preferences are readable; saving changes requires operator (Execute) access.";

const DIGESTS_PAGE_SUBTITLE =
  "Send scheduled summaries of review activity, governance signals, findings, and advisory scans.";

const DIGEST_PRIVACY_NOTE =
  "Digest emails include summaries and links back to ArchLucid. Sensitive evidence content is not included unless explicitly configured.";

/**
 * Single `/digests` surface: browse, subscriptions, and executive digest schedule. Tab state in `?tab=` for deep links.
 */
export function DigestsHubClient(): ReactElement {
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

  const activeTab: DigestsHubTabId = useMemo(
    () => digestsHubTabFromSearchParam(rawTab),
    [rawTab],
  );

  const onSelectTab = useCallback(
    (id: string) => {
      const tabId: DigestsHubTabId = digestsHubTabFromSearchParam(id);

      if (tabId === "browse") {
        router.push(pathname);
        return;
      }

      router.push(`${pathname}?${TAB_PARAM}=${encodeURIComponent(tabId)}`);
    },
    [pathname, router],
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

  const previewActionTitle =
    "Opens the most recently generated digest summary. Uses saved schedule and subscription settings for delivery.";
  const sendTestActionTitle =
    "Triggers an advisory scan to generate a test digest. Delivery uses saved subscriptions and schedule recipients.";

  const configured: boolean = healthSnap !== null && digestsHaveExistingConfiguration(healthSnap);
  const primaryHref: string = configured ? "/digests?tab=schedule" : "/digests?tab=subscriptions";
  const primaryLabel: string = configured ? "Configure weekly digest" : "Create digest";
  const latestDigestId: string | null | undefined = healthSnap?.latestArchitectureDigestId;
  const previewHref: string =
    latestDigestId !== null && latestDigestId !== undefined && latestDigestId.trim() !== ""
      ? `/digests?tab=browse#digest-${encodeURIComponent(latestDigestId)}`
      : "/digests";

  const lastUpdatedLabel: string =
    lastUpdatedUtc === null
      ? "—"
      : new Date(lastUpdatedUtc).toLocaleString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });

  return (
    <div className="px-0" data-testid="digests-hub">
      <OperatorPageHeader
        title="Architecture digests"
        subtitle={DIGESTS_PAGE_SUBTITLE}
        titleTestId="digests-page-title"
        actions={
          <>
            <Button asChild size="sm" variant="primary" data-testid="digests-primary-action">
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid="digests-preview-action"
              title={previewActionTitle}
            >
              <Link href={previewHref}>Preview digest</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              data-testid="digests-send-test-action"
              title={sendTestActionTitle}
            >
              <Link href="/advisory?tab=schedules">Send test</Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onRefresh}
                disabled={refreshing}
                data-testid="digests-refresh-button"
                title={
                  canMutate
                    ? digestsListRefreshButtonTitleOperator
                    : digestsListRefreshButtonTitleReader
                }
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </Button>
              <span
                className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="digests-last-updated"
              >
                Last updated: {lastUpdatedLabel}
              </span>
            </div>
          </>
        }
      />

      <WeeklyDigestHealthBanner
        refreshToken={healthRefreshToken}
        onHealthLoaded={onHealthLoaded}
        variant={healthBannerVariant}
      />

      {activeTab !== "subscriptions" ? (
        <p
          className={cn(
            "mb-4 m-0 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="digests-privacy-note"
        >
          {DIGEST_PRIVACY_NOTE}
        </p>
      ) : null}

      <Tabs value={activeTab} onValueChange={onSelectTab} className="mb-4">
        <TabsList aria-label="Digest hub sections" data-testid="digests-hub-tablist">
          {DIGESTS_HUB_TAB_IDS.map((id) => {
            const softMuted: boolean = !canMutate && (id === "subscriptions" || id === "schedule");
            const tabTitle: string | undefined =
              !canMutate && id === "subscriptions"
                ? SUBSCRIPTIONS_TAB_READER_TITLE
                : !canMutate && id === "schedule"
                  ? SCHEDULE_TAB_READER_TITLE
                  : undefined;

            return (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`digests-hub-tab-${id}`}
                title={tabTitle}
                className={softMuted ? "opacity-70" : undefined}
              >
                {TAB_LABEL[id]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="browse" className="mt-4" data-testid="digests-hub-panel">
          <DigestsBrowseContent
            refreshToken={browseRefreshToken}
            onLoaded={onBrowseLoaded}
            hidePageHeader
          />
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-4">
          <DigestSubscriptionsContent />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <ExecDigestScheduleContent refreshToken={scheduleRefreshToken} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
