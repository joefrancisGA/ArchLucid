"use client";

import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { SETTINGS_NOTIFICATIONS_PATH } from "@/lib/settings-admin-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useNotificationChannelDeliveryStatus } from "@/hooks/use-notification-channel-delivery-status";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY,
  NOTIFICATION_PREFERENCE_CENTER_RELATIONS_SECTIONS,
} from "@/lib/notification-preference-center";
import { cn } from "@/lib/utils";

export function NotificationPreferenceCenterPageView() {
  const { statusByChannelId } = useNotificationChannelDeliveryStatus();

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="notification-preference-center-page">
      <OperatorPageHeader
        navHref={SETTINGS_NOTIFICATIONS_PATH}
        title={NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE}
        subtitle={NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE}
        titleTestId="notification-preference-center-page-title"
        actions={<PageContextualHelpButton />}
      />

      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="notification-preference-center-orientation"
      >
        {NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE}
      </p>

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

      <details
        className="group rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="notification-preference-center-relations-disclosure"
      >
        <summary
          className={cn(
            "cursor-pointer list-none font-medium text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
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
    </OperatorPageContainer>
  );
}
