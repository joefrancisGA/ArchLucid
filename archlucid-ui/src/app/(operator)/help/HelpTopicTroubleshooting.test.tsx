import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: () => <button type="button">Download support bundle</button>,
}));

vi.mock("@/app/(operator)/help/_sections/HelpTroubleshootingAdvancedDiagnostics", () => ({
  HelpTroubleshootingAdvancedDiagnostics: () => <div data-testid="troubleshooting-advanced-diagnostics-mock" />,
}));

import { HelpTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpTroubleshootingGuideView";
import { TROUBLESHOOTING_HELP_SUBTITLE } from "@/lib/troubleshooting-help-guide-content";
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

  it("renders start-here actions and a visible decision tree", () => {
    if (entry === undefined) {
      throw new Error("Expected troubleshooting documentation entry.");
    }

    render(<HelpTroubleshootingGuideView entry={entry} />);

    expect(screen.getByRole("heading", { level: 1, name: "Troubleshooting" })).toBeInTheDocument();
    expect(screen.getByText(TROUBLESHOOTING_HELP_SUBTITLE)).toBeInTheDocument();

    const startHere = screen.getByTestId("troubleshooting-start-here-card");
    expect(within(startHere).getByRole("link", { name: "Open System health" })).toHaveAttribute("href", "/health");
    expect(within(startHere).getByRole("button", { name: "Download support bundle" })).toBeInTheDocument();
    expect(within(startHere).getByRole("link", { name: "Contact support" })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net",
    );

    expect(screen.getByTestId("troubleshooting-decision-tree")).toBeInTheDocument();
    expect(screen.getByText(/Can you sign in\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Still blocked\?/i)).toBeInTheDocument();
  });

  it("renders accordion issues with specific next-step links", () => {
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
