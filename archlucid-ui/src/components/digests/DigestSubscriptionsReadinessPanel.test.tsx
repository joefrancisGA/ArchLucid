import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DigestSubscriptionsReadinessPanel } from "@/components/digests/DigestSubscriptionsReadinessPanel";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

function sampleHealth(overrides: Partial<WeeklyDigestHealthDto> = {}): WeeklyDigestHealthDto {
  return {
    enabledAdvisoryScheduleCount: 1,
    digestSubscriptionCount: 0,
    enabledDigestSubscriptionCount: 0,
    digestSubscriptionsByEmailChannel: 0,
    digestSubscriptionsBySlackChannel: 0,
    digestSubscriptionsByTeamsChannel: 0,
    executiveEmailDigestIsConfigured: false,
    executiveEmailDigestEnabled: false,
    executiveDigestRecipientCount: 0,
    executiveDigestIanaTimeZoneId: "UTC",
    executiveDigestDayOfWeek: 1,
    executiveDigestHourOfDay: 8,
    setupGaps: [],
    ...overrides,
  };
}

describe("DigestSubscriptionsReadinessPanel", () => {
  it("renders ready state without blocking notification", () => {
    render(
      <DigestSubscriptionsReadinessPanel
        healthSnap={sampleHealth()}
        subscriptions={[
          {
            subscriptionId: "s1",
            tenantId: "t",
            workspaceId: "w",
            projectId: "p",
            name: "Ops mailbox",
            channelType: "Email",
            destination: "ops@example.com",
            isEnabled: true,
            createdUtc: "2026-07-01T00:00:00Z",
            metadataJson: "{}",
          } satisfies DigestSubscription,
        ]}
      />,
    );

    expect(screen.getByText("Ready to deliver")).toBeInTheDocument();
    expect(screen.queryByTestId("digest-subscriptions-readiness-blocking")).not.toBeInTheDocument();
    expect(screen.getByText("Active destinations")).toBeInTheDocument();
  });

  it("renders blocking notification with primary schedule CTA", () => {
    render(
      <DigestSubscriptionsReadinessPanel
        healthSnap={sampleHealth({ enabledAdvisoryScheduleCount: 0 })}
        subscriptions={[]}
      />,
    );

    expect(screen.getByTestId("digest-subscriptions-readiness-blocking")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configure schedule" })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_SCHEDULES_HREF,
    );
  });

  it("renders blocking notification with primary add-destination CTA", () => {
    const onAddDeliveryDestination = vi.fn();

    render(
      <DigestSubscriptionsReadinessPanel
        healthSnap={sampleHealth()}
        subscriptions={[]}
        onAddDeliveryDestination={onAddDeliveryDestination}
      />,
    );

    fireEvent.click(screen.getByTestId("digest-subscriptions-readiness-add-destination"));
    expect(onAddDeliveryDestination).toHaveBeenCalledTimes(1);
  });
});
