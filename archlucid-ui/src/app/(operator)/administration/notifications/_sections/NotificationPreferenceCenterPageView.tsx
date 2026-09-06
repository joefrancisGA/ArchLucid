"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { NotificationPreferenceCenterEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { useNotificationChannelDeliveryStatus } from "@/hooks/use-notification-channel-delivery-status";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY,
  NOTIFICATION_PREFERENCE_CENTER_RELATIONS_SECTIONS,
  notificationPreferenceCenterPageSubtitle,
} from "@/lib/notification-preference-center";
import {
  resolveNotificationPreferenceSaveChannelEmphasizedStepId,
  resolveNotificationPreferenceSaveChannelSteps,
} from "@/lib/notification-preference-save-channel-checklist";
import {
  notificationPreferenceRelationsDisclosureHrefFromSearch,
  parseNotificationPreferenceRelationsOpenFromSearch,
} from "@/lib/administration/notification-preference-relations-disclosure-url";
import { cn } from "@/lib/utils";

import { NotificationPreferenceCenterBreadcrumb } from "./NotificationPreferenceCenterBreadcrumb";
import { NotificationPreferenceCenterBuyerChrome } from "./NotificationPreferenceCenterBuyerChrome";
import { NotificationPreferenceCenterLoadingSkeleton } from "./NotificationPreferenceCenterLoadingSkeleton";
import {
  NOTIFICATION_PREFERENCE_CENTER_LOAD_ERROR,
  NOTIFICATION_PREFERENCE_CENTER_LOAD_ERROR_RETRY_LABEL,
  NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID,
  NOTIFICATION_PREFERENCE_CENTER_SKIP_LINK_LABEL,
} from "./notification-preference-center-page-copy";

export function NotificationPreferenceCenterPageView() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const notificationPreferenceRelationsOpenParam = searchParams.get("notificationPreferenceRelationsOpen");
  const [relationsOpen, setRelationsOpenState] = useState(() =>
    parseNotificationPreferenceRelationsOpenFromSearch(notificationPreferenceRelationsOpenParam),
  );
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { statusByChannelId, loading, loadFailed, refresh } = useNotificationChannelDeliveryStatus();
  const channelReady = (channelId: string): boolean => statusByChannelId[channelId]?.kind === "ready";
  const saveChannelChecklistInput = {
    channelsReviewed: !loading && !loadFailed,
    primaryChannelsReady: channelReady("digests") && channelReady("alerts-inbox"),
    allChannelsReady: NOTIFICATION_PREFERENCE_CHANNELS.every((channel) => channelReady(channel.id)),
  };
  const saveChannelSteps = resolveNotificationPreferenceSaveChannelSteps(saveChannelChecklistInput);
  const saveChannelEmphasizedStepId =
    resolveNotificationPreferenceSaveChannelEmphasizedStepId(saveChannelChecklistInput);

  const syncRelationsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        notificationPreferenceRelationsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRelationsOpen = useCallback(
    (open: boolean) => {
      setRelationsOpenState(open);
      syncRelationsOpenToUrl(open);
    },
    [syncRelationsOpenToUrl],
  );

  useEffect(() => {
    setRelationsOpenState(
      parseNotificationPreferenceRelationsOpenFromSearch(notificationPreferenceRelationsOpenParam),
    );
  }, [notificationPreferenceRelationsOpenParam]);

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="notification-preference-center-page">
      {buyerPolishedShell ? (
        <a
          href={`#${NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {NOTIFICATION_PREFERENCE_CENTER_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <div
        id={buyerPolishedShell ? NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID : undefined}
        data-testid={
          buyerPolishedShell ? "notification-preference-center-primary-content" : undefined
        }
        className={cn(buyerPolishedShell ? "scroll-mt-24" : undefined, OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={SETTINGS_NOTIFICATIONS_PATH}
          title={NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE}
          subtitle={notificationPreferenceCenterPageSubtitle(buyerPolishedShell)}
          titleTestId="notification-preference-center-page-title"
          breadcrumb={buyerPolishedShell ? <NotificationPreferenceCenterBreadcrumb /> : undefined}
          actions={<PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />}
        />

        {buyerPolishedShell ? <NotificationPreferenceCenterBuyerChrome /> : (
          <NotificationPreferenceCenterEvidenceOrientationStrip />
        )}

        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="notification-preference-center-orientation-line"
        >
          {NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE}
        </p>

        {loadFailed ? (
          <div
            className="space-y-2 rounded-md border border-neutral-200 px-3 py-3 dark:border-neutral-800"
            data-testid="notification-preference-center-load-error"
          >
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {NOTIFICATION_PREFERENCE_CENTER_LOAD_ERROR}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="notification-preference-center-load-retry"
              onClick={refresh}
            >
              {NOTIFICATION_PREFERENCE_CENTER_LOAD_ERROR_RETRY_LABEL}
            </Button>
          </div>
        ) : loading ? (
          <NotificationPreferenceCenterLoadingSkeleton />
        ) : (
          <>
            <IntegrationConnectChecklist
              title="Save channel checklist"
              steps={saveChannelSteps}
              emphasizedStepId={saveChannelEmphasizedStepId}
              testIdPrefix="notification-preference-save-channel"
            />
          <div
            className="grid gap-4 md:grid-cols-2"
            data-testid="notification-preference-channel-grid"
            role="list"
          >
            {NOTIFICATION_PREFERENCE_CHANNELS.map((channel) => {
              const deliveryStatus = statusByChannelId[channel.id];

              return (
                <Card
                  key={channel.id}
                  data-testid={`notification-preference-channel-${channel.id}`}
                  role="listitem"
                >
                  <CardHeader className="space-y-1">
                    <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
                      {channel.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
                    <p className="m-0 text-al-text-secondary">{channel.whatItDoes}</p>
                    <div
                      className="space-y-1"
                      data-testid={`notification-preference-status-${channel.id}`}
                    >
                      <StatusTag
                        kind={deliveryStatus.kind}
                        label={deliveryStatus.label}
                        data-testid={`notification-preference-status-tag-${channel.id}`}
                      />
                      {deliveryStatus.provenanceFact !== null ? (
                        <p
                          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                          data-testid={`notification-preference-status-fact-${channel.id}`}
                        >
                          {deliveryStatus.provenanceFact}
                        </p>
                      ) : null}
                    </div>
                    <p
                      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`notification-preference-status-hint-${channel.id}`}
                    >
                      {deliveryStatus.configureHint}
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={channel.href}>{channel.ctaLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </>
        )}

        <details
          className="group rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="notification-preference-center-relations-disclosure"
          open={relationsOpen}
          onToggle={(event) => {
            setRelationsOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-2 font-medium text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            <DisclosureTriangleIndicator />
            {NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY}
          </summary>
          <div className="mt-4 space-y-4">
            {NOTIFICATION_PREFERENCE_CENTER_RELATIONS_SECTIONS.map((section) => (
              <section key={section.id} className="space-y-2" data-testid={`notification-preference-relations-${section.id}`}>
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{section.heading}</h3>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{section.body}</p>
                <ul className={cn("m-0 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {section.links.map((link) => (
                    <li key={link.id}>
                      <Link href={link.href} className="font-medium text-al-link hover:underline">
                        {link.label}
                      </Link>
                      {" — "}
                      {link.whenToUse}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </details>
      </div>
    </OperatorPageContainer>
  );
}
