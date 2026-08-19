import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
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
        provenanceFact: "No open governance alerts right now.",
        configureHint:
          "Configure triage and resolution for governance alerts in the Alerts inbox.",
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

import NotificationPreferenceCenterPage from "./page";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
  NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY,
} from "@/lib/notification-preference-center";

describe("NotificationPreferenceCenterPage (TB-2203)", () => {
  it("renders channel cards with StatusTags, outline CTAs, and relations disclosure", async () => {
    const page = await NotificationPreferenceCenterPage();

    render(page);

    expect(screen.getByTestId("notification-preference-center-page-title")).toHaveTextContent(
      NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
    );
    expect(screen.getByTestId("notification-preference-center-orientation-line")).toHaveTextContent(
      NOTIFICATION_PREFERENCE_CENTER_ORIENTATION_LINE,
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("notification-preference-center-disclaimer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("digests-notifications-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("notification-preference-center-relations-disclosure")).toHaveTextContent(
      NOTIFICATION_PREFERENCE_CENTER_RELATIONS_DISCLOSURE_SUMMARY,
    );

    const grid = screen.getByTestId("notification-preference-channel-grid");
    expect(grid).toHaveAttribute("role", "list");

    for (const channel of NOTIFICATION_PREFERENCE_CHANNELS) {
      const card = screen.getByTestId(`notification-preference-channel-${channel.id}`);
      expect(card).toHaveAttribute("role", "listitem");
      expect(within(card).getByRole("heading", { level: 3, name: channel.title })).toBeInTheDocument();
      expect(screen.getByTestId(`notification-preference-status-tag-${channel.id}`)).toBeInTheDocument();

      const cta = screen.getByRole("link", { name: channel.ctaLabel });
      expect(cta).toHaveAttribute("href", channel.href);
      expect(cta.className).not.toMatch(/underline/);
    }
  });
});
