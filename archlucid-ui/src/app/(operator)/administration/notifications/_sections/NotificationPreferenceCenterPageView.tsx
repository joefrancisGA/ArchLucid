"use client";

import Link from "next/link";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { TeamsSlackNotificationVocabularyRail } from "@/components/TeamsSlackNotificationVocabularyRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  statusHintForNotificationChannel,
} from "@/lib/notification-preference-center";
import { cn } from "@/lib/utils";

export function NotificationPreferenceCenterPageView() {
  return (
    <div className="w-full max-w-[62rem] space-y-6" data-testid="notification-preference-center-page">
      <OperatorPageHeader
        title={NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE}
        subtitle={NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE}
        titleTestId="notification-preference-center-page-title"
        actions={<PageContextualHelpButton />}
      />

      <TeamsSlackNotificationVocabularyRail currentSurfaceId="notifications-hub" />

      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="notification-preference-center-disclaimer"
      >
        {NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER}
      </p>

      <div className="grid gap-4 md:grid-cols-2" data-testid="notification-preference-channel-grid">
        {NOTIFICATION_PREFERENCE_CHANNELS.map((channel) => (
          <Card key={channel.id} data-testid={`notification-preference-channel-${channel.id}`}>
            <CardHeader className="space-y-1">
              <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{channel.title}</CardTitle>
            </CardHeader>
            <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
              <p className="m-0 text-al-text-secondary">{channel.whatItDoes}</p>
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid={`notification-preference-status-hint-${channel.id}`}
              >
                {statusHintForNotificationChannel(channel)}
              </p>
              <Button asChild variant="default" size="sm">
                <Link className={OPERATOR_LINK.nav} href={channel.href}>
                  {channel.ctaLabel}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}