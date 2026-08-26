import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: ({
    showContentsDisclosure,
  }: {
    showContentsDisclosure?: boolean;
  }) => (
    <div>
      <button type="button">Download support bundle</button>
      {showContentsDisclosure ? (
        <p data-testid="support-bundle-contents-disclosure">Bundle disclosure mock</p>
      ) : null}
    </div>
  ),
}));

vi.mock("@/app/(operator)/help/_sections/HelpTroubleshootingAdvancedDiagnostics", () => ({
  HelpTroubleshootingAdvancedDiagnostics: () => <div data-testid="troubleshooting-advanced-diagnostics-mock" />,
}));

vi.mock("@/components/help/TroubleshootingStartHerePlatformStatus", () => ({
  TroubleshootingStartHerePlatformStatus: () => (
    <div data-testid="troubleshooting-platform-status">
      <span>Platform healthy</span>
      <span>Checked at 12:00</span>
    </div>
  ),
}));

import { HelpTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpTroubleshootingGuideView";
import {
  expectClaimDisciplineBandContent,
} from "@/lib/claim-discipline-test-helpers";
import {
  TROUBLESHOOTING_HELP_SUBTITLE,
  TROUBLESHOOTING_PRIMARY_ACTIONS,
} from "@/lib/troubleshooting-help-guide-content";
import {
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_SUPPORT_EXPECTATIONS,
} from "@/lib/troubleshooting-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const BANNED_BUYER_COPY = [
  "api readiness",
  "api path",
  "demo seed",
  "pipeline status",
  "correlation id",
  "extractor path",
  "/health)",
  "admin diagnostics",
] as const;

describe("HelpTroubleshootingGuideView", () => {
  const entry = getProductDocumentationEntry("troubleshooting");

  it("registers the troubleshooting guide entry", () => {
    expect(entry?.title).toBe("Troubleshooting");
    expect(entry?.summary).toContain("first fix");
  });

  it("renders start-here actions, orientation, and a visible decision tree", () => {
    if (entry === undefined) {
      throw new Error("Expected troubleshooting documentation entry.");
    }

    render(<HelpTroubleshootingGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Troubleshooting" })).toBeInTheDocument();
    expect(screen.getByText(TROUBLESHOOTING_HELP_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("troubleshooting-help-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-troubleshooting-claim-discipline-strip")).toHaveTextContent(
      TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "troubleshooting-help",
      "troubleshooting-help-claim-discipline",
      TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const startHere = screen.getByTestId("troubleshooting-start-here-card");
    expect(within(startHere).getByTestId("troubleshooting-platform-status")).toBeInTheDocument();
    expect(within(startHere).getByRole("link", { name: "Open System health" })).toHaveAttribute(
      "href",
      "/administration/system-health",
    );
    expect(within(startHere).getByRole("button", { name: "Download support bundle" })).toBeInTheDocument();
    expect(within(startHere).getByTestId("support-bundle-contents-disclosure")).toBeInTheDocument();
    expect(
      within(startHere).getByRole("link", { name: TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.label }),
    ).toHaveAttribute("href", TROUBLESHOOTING_PRIMARY_ACTIONS.contactSupport.href);
    expect(within(startHere).getByTestId("troubleshooting-support-expectations-start-here")).toHaveTextContent(
      TROUBLESHOOTING_SUPPORT_EXPECTATIONS,
    );

    expect(screen.getByTestId("troubleshooting-decision-tree")).toBeInTheDocument();
    expect(screen.getByText(/Can you sign in\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Still blocked\?/i)).toBeInTheDocument();
    expect(screen.getByTestId("troubleshooting-support-expectations")).toHaveTextContent(
      TROUBLESHOOTING_SUPPORT_EXPECTATIONS,
    );
  });

  it("renders accordion issues with expand affordance and filters by sign-in", () => {
    if (entry === undefined) {
      throw new Error("Expected troubleshooting documentation entry.");
    }

    render(<HelpTroubleshootingGuideView entry={entry} />);

    const evidenceIssue = screen.getByTestId("troubleshooting-issue-evidence-upload-failed");
    expect(within(evidenceIssue).getByText("What you see")).toBeInTheDocument();
    expect(within(evidenceIssue).getByRole("link", { name: "Open evidence upload guide" })).toHaveAttribute(
      "href",
      "/help/evidence-intake",
    );
    expect(evidenceIssue.querySelector("svg")).not.toBeNull();

    fireEvent.change(screen.getByTestId("troubleshooting-issue-filter"), {
      target: { value: "sign in" },
    });

    expect(screen.getByTestId("troubleshooting-issue-organization-sso-required")).toBeInTheDocument();
    expect(screen.queryByTestId("troubleshooting-issue-findings-count-wrong")).not.toBeInTheDocument();
  });

  it("labels common-issues and decision-tree regions from their headings", () => {
    if (entry === undefined) {
      throw new Error("Expected troubleshooting documentation entry.");
    }

    render(<HelpTroubleshootingGuideView entry={entry} />);

    expect(screen.getByRole("region", { name: "Common issues" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Decision tree" })).toBeInTheDocument();
  });

  it("avoids internal implementation language in the default guide body", () => {
    if (entry === undefined) {
      throw new Error("Expected troubleshooting documentation entry.");
    }

    render(<HelpTroubleshootingGuideView entry={entry} />);

    const corpus = document.body.textContent?.toLowerCase() ?? "";

    for (const term of BANNED_BUYER_COPY) {
      expect(corpus, term).not.toContain(term);
    }
  });
});
