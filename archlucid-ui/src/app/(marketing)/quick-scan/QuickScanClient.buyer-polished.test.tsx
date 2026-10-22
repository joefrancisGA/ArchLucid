import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/quick-scan/quick-scan-telemetry", () => ({
  trackQuickScanConversionClick: vi.fn(),
  trackQuickScanSampleViewed: vi.fn(),
}));

vi.mock("@/components/auth/TurnstileBotChallenge", () => ({
  TurnstileBotChallenge: () => <div data-testid="turnstile-bot-challenge" />,
}));

vi.mock("@/lib/auth/turnstile-config", () => ({
  isTurnstileBotChallengeConfigured: vi.fn(() => true),
  readTurnstileSiteKey: vi.fn(() => "site-key-test"),
}));

import { QuickScanClient } from "@/app/(marketing)/quick-scan/QuickScanClient";
import {
  QUICK_SCAN_BUYER_OVERVIEW,
  QUICK_SCAN_FIRST_VIEWPORT_TEST_ID,
  QUICK_SCAN_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  QUICK_SCAN_HERO_LEAD,
  QUICK_SCAN_ORIENTATION_BOTTOM_TEST_ID,
  QUICK_SCAN_PRIMARY_CONTENT_ID,
  QUICK_SCAN_SKIP_LINK_LABEL,
  QUICK_SCAN_SKIP_TARGET_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";
import {
  QUICK_SCAN_CLAIM_DISCIPLINE,
  QUICK_SCAN_FOLLOW_UPS_TITLE,
  QUICK_SCAN_SOURCES,
} from "@/lib/quick-scan-evidence-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

describe("QuickScanClient buyer-polished shell (QXX)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          capacityAvailable: true,
          requireSignIn: false,
          sampleResultAvailable: true,
        }),
      }),
    );
  });

  it("renders skip link, intro lead, overview, workspace before follow-ups, and sources footer", async () => {
    render(<QuickScanClient />);

    await waitFor(() => {
      expect(screen.getByTestId("quick-scan-submit")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: QUICK_SCAN_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${QUICK_SCAN_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(QUICK_SCAN_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      QUICK_SCAN_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("quick-scan-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("quick-scan-scope-disclosure")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-scan-hero-meta")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: QUICK_SCAN_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId(QUICK_SCAN_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(QUICK_SCAN_FIRST_VIEWPORT_TEST_ID);
    const overview = screen.getByTestId("quick-scan-overview");
    const workspace = screen.getByTestId("quick-scan-workspace");
    const orientationBottom = screen.getByTestId(QUICK_SCAN_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("quick-scan-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(screen.getByTestId("quick-scan-intro")).toHaveTextContent(QUICK_SCAN_HERO_LEAD);
    expect(screen.getByTestId("quick-scan-overview")).toHaveTextContent(QUICK_SCAN_BUYER_OVERVIEW);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(within(workspace).getByTestId("quick-scan-submit")).toBeInTheDocument();
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(QUICK_SCAN_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
