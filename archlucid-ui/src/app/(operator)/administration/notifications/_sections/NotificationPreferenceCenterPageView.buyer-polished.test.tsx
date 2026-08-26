import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/use-notification-channel-delivery-status", () => ({
  useNotificationChannelDeliveryStatus: () => ({
    loading: false,
    loadFailed: false,
    refresh: vi.fn(),
    statusByChannelId: {
      digests: {
        kind: "ready",
        label: "Connected",
        provenanceFact: "1 active digest subscription.",
        configureHint: "Configure email digests and subscriptions on Digests.",
      },
      "alerts-inbox": {
        kind: "ready",
        label: "Connected",
        provenanceFact: "No open alerts right now.",
        configureHint:
          "Configure triage and resolution for alerts in the Alerts inbox.",
      },
      "alert-rules": {
        kind: "needs-attention",
        label: "Disabled",
        provenanceFact: "1 enabled rule with no routing destinations.",
        configureHint: "Configure alert conditions and notification routing on Alert rules.",
      },
      teams: {
        kind: "needs-attention",
        label: "Not configured",
        provenanceFact: null,
        configureHint: "Configure which events post to Microsoft Teams on the Teams integration page.",
      },
      slack: {
        kind: "needs-attention",
        label: "Not configured",
        provenanceFact: "No Slack destinations in this workspace.",
        configureHint: "Configure which events post to Slack on the Slack integration page.",
      },
    },
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button" data-testid="page-contextual-help-button">Help</button>,
}));

import { NotificationPreferenceCenterPageView } from "./NotificationPreferenceCenterPageView";
import {
  BUYER_NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE,
} from "@/lib/notification-preference-center";
import {
  NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID,
  NOTIFICATION_PREFERENCE_CENTER_SKIP_LINK_LABEL,
} from "./notification-preference-center-page-copy";

describe("NotificationPreferenceCenterPageView buyer-polished shell (ADN)", () => {
  it("renders skip link, breadcrumb, claim orientation, and buyer subtitle", () => {
    render(<NotificationPreferenceCenterPageView />);

    expect(screen.getByRole("link", { name: NOTIFICATION_PREFERENCE_CENTER_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("notification-preference-center-primary-content")).toHaveAttribute(
      "id",
      NOTIFICATION_PREFERENCE_CENTER_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("notification-preference-center-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-preference-center-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("notification-preference-center-sources")).toBeInTheDocument();
    expect(screen.getByText(BUYER_NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.queryByText(NOTIFICATION_PREFERENCE_CENTER_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-preference-channel-grid")).toBeInTheDocument();
  });
});
