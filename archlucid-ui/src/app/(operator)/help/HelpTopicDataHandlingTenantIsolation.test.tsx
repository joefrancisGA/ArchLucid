import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/data-handling",
}));

import { HelpDataHandlingTenantIsolationGuideView } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationGuideView";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpDataHandlingTenantIsolationGuideView", () => {
  const loaded = tryLoadProductDocumentation("data-handling");

  it("loads tenant-isolation help from the monorepo", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("What ArchLucid does with your data");
  });

  it("renders specialty diligence chrome with three-layer isolation (TB-1659)", () => {
    if (loaded === null) {
      throw new Error("Expected data-handling documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: loaded.entry.slug,
    });

    render(<HelpDataHandlingTenantIsolationGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("buyer_security_procurement_packet");
    expect(visible).not.toContain("scripts/");
    expect(visible).toContain("three layers");
    expect(visible).toContain("sql row-level security is not the production isolation boundary");
    expect(screen.getByTestId("help-data-handling-tenant-isolation-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-data-handling-tenant-isolation-residency")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-data-handling-tenant-isolation-action-panel");

    expect(
      within(actionPanel).getByRole("link", {
        name: DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.label,
      }),
    ).toHaveAttribute("href", DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.openTrustCenter.href);
    expect(
      within(actionPanel).getByRole("link", {
        name: DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.label,
      }),
    ).toHaveAttribute("href", DATA_HANDLING_TENANT_ISOLATION_HELP_PRIMARY_ACTIONS.securityTrust.href);

    expect(screen.queryByTestId("help-data-handling-tenant-isolation-sources")).toBeNull(); // TB-2092
expect(screen.getAllByRole("link", { name: /security and trust/i }).length).toBeGreaterThan(0);
  });
});
