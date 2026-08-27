import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/first-value-20-minutes",
}));

import { HelpFirstValue20GuideView } from "@/app/(operator)/help/_sections/HelpFirstValue20GuideView";
import {
  FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE,
  FIRST_VALUE_20_HELP_PAGE_TITLE,
  FIRST_VALUE_20_HELP_PRIMARY_ACTIONS,
  FIRST_VALUE_20_HELP_SOURCES,
} from "@/lib/first-value-20-help-guide-content";
import { expectClaimDisciplineBandContent } from "@/lib/claim-discipline-test-helpers";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadFoldedInternalRunbook } from "@/lib/load-product-documentation";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help/help-topic-permanent-redirects";

describe("HelpFirstValue20GuideView (folded into COR, Batch R)", () => {
  const loaded = tryLoadFoldedInternalRunbook("first-value-20-minutes");

  it("does not redirect the retired first-value-20-minutes slug", () => {
    expect(resolveHelpTopicPermanentRedirect("first-value-20-minutes")).toBeNull();
  });

  it("loads first-value-20 help from the operator runbook source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toContain("20 minutes");
    expect(loaded?.entry.lastReviewed).toBe("2026-08-09");
  });

  it("renders specialty Admin chrome with 20-minute body only (TB-1691 / TB-1692 / TB-1695)", () => {
    if (loaded === null) {
      throw new Error("Expected first-value-20-minutes documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: loaded.entry.slug,
    });

    render(<HelpFirstValue20GuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("dotnet run --project");
    expect(preparedMarkdown.toLowerCase()).not.toContain("phase a — platform ready");
    expect(preparedMarkdown.toLowerCase()).not.toContain("phase a");
    expect(preparedMarkdown.toLowerCase()).not.toContain("â");
    expect(preparedMarkdown.toLowerCase()).toContain("archlucid doctor");
    expect(visible).not.toContain("role_index");
    expect(visible).not.toContain("first-pilot operator path (internal runbook)");
    expect(visible).toContain("20 minutes");
    expect(screen.getByTestId("help-first-value-20-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-value-20-page-title")).toHaveTextContent(
      FIRST_VALUE_20_HELP_PAGE_TITLE,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.queryByTestId("help-topic-registry-provenance")).toBeNull();
    expect(screen.getByTestId("help-first-value-20-admin-tag")).toHaveTextContent("Admin only");
    expect(screen.queryByTestId("help-first-value-20-claim-discipline")).toBeNull();
    expect(screen.getByTestId("help-first-value-20-claim-discipline-strip")).toHaveTextContent(
      FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-first-value-20-minutes",
      "help-first-value-20-claim-discipline",
      FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-first-value-20-job-matrix")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-value-20-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-value-20-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-first-value-20-job-matrix-current")).toHaveAttribute(
      "aria-current",
      "page",
    );

    const actionPanel = screen.getByTestId("help-first-value-20-action-panel");
    const orientation = screen.getByTestId("help-first-value-20-orientation");
    const claimStrip = screen.getByTestId("help-first-value-20-claim-discipline-strip");

    expect(claimStrip.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(orientation.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.className).not.toMatch(/bg-teal-/);

    expect(
      within(actionPanel).getByRole("link", {
        name: FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.label,
      }),
    ).toHaveAttribute("href", FIRST_VALUE_20_HELP_PRIMARY_ACTIONS.startArchitectureReview.href);

    for (const source of FIRST_VALUE_20_HELP_SOURCES) {
      expect(within(screen.getByTestId("help-first-value-20-sources")).getByRole("link", { name: source.label }))
        .toHaveAttribute("href", source.href);
    }

    expect(visible).not.toContain("first-pilot operator path");
  });
});
