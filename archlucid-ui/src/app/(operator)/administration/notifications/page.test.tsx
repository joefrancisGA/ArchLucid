import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-stub" />,
}));

import NotificationPreferenceCenterPage from "./page";
import {
  NOTIFICATION_PREFERENCE_CHANNELS,
  NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER,
  NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
} from "@/lib/notification-preference-center";

describe("NotificationPreferenceCenterPage (TB-2203)", () => {
  it("renders channel cards with configure CTAs", async () => {
    const page = await NotificationPreferenceCenterPage();

    render(page);

    expect(screen.getByTestId("notification-preference-center-page-title")).toHaveTextContent(
      NOTIFICATION_PREFERENCE_CENTER_PAGE_TITLE,
    );
    expect(screen.getByTestId("notification-preference-center-disclaimer")).toHaveTextContent(
      NOTIFICATION_PREFERENCE_CENTER_HUB_DISCLAIMER,
    );

    for (const channel of NOTIFICATION_PREFERENCE_CHANNELS) {
      expect(screen.getByTestId(`notification-preference-channel-${channel.id}`)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: channel.ctaLabel })).toHaveAttribute("href", channel.href);
    }
  });
});