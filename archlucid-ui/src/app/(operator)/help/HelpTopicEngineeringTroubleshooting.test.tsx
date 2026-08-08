import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/developer-troubleshooting",
}));

import { HelpEngineeringTroubleshootingGuideView } from "@/app/(operator)/help/_sections/HelpEngineeringTroubleshootingGuideView";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpEngineeringTroubleshootingGuideView", () => {
  const loaded = tryLoadProductDocumentation("developer-troubleshooting");

  it("loads engineering troubleshooting help from runbook sources", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.slug).toBe("developer-troubleshooting");
    expect(loaded?.entry.title).toBe("Engineering troubleshooting runbook");
  });

  it("renders specialty Admin chrome with customer-path CTAs and Sources", () => {
    if (loaded === null) {
      throw new Error("Expected developer-troubleshooting documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "developer-troubleshooting",
      preserveMaintenanceMetadata: true,
    });

    render(<HelpEngineeringTroubleshootingGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-engineering-troubleshooting-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByTestId("help-engineering-troubleshooting-claim-discipline")).toBeNull(); // TB-2092
    const actionPanel = screen.getByTestId("help-engineering-troubleshooting-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.label,
      }),
    ).toHaveAttribute(
      "href",
      ENGINEERING_TROUBLESHOOTING_HELP_PRIMARY_ACTIONS.openCustomerTroubleshooting.href,
    );

    expect(screen.queryByTestId("help-engineering-troubleshooting-sources")).toBeNull(); // TB-2092
    for (const link of ENGINEERING_TROUBLESHOOTING_HELP_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(preparedMarkdown).not.toMatch(/\]\([^)]*architecture\/adrs\//i);
    expect(preparedMarkdown).not.toMatch(/\bTB-\d+\b/);
  });
});
