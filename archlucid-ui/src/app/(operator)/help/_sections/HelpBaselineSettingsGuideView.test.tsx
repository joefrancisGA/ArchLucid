import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => "/help/baseline-settings",
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  };
});

import { render, screen, within } from "@testing-library/react";
import { HelpBaselineSettingsGuideView } from "@/app/(operator)/help/_sections/HelpBaselineSettingsGuideView";
import {
  expectClaimDisciplineBandContent,
  whereToGoNextFollowUpLinksForTests,
} from "@/lib/claim-discipline-test-helpers";
import {
  BASELINE_SETTINGS_HELP_CANONICAL_PATH,
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID,
  BASELINE_SETTINGS_HELP_GUIDE_HEADINGS,
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
} from "@/lib/baseline-settings-help-guide-content";
import { BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER } from "@/lib/baseline-settings-present";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpBaselineSettingsGuideView", () => {
  const entry = getProductDocumentationEntry("baseline-settings");

  it("renders provenance, saved-baseline warn, role precondition, and readingBody", () => {
    if (entry === undefined) {
      throw new Error("Expected baseline-settings documentation entry.");
    }

    render(<HelpBaselineSettingsGuideView entry={entry} />);

    expect(screen.getByTestId("help-baseline-settings-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
    expect(screen.getByTestId("help-baseline-settings-saved-baseline-warn")).toHaveTextContent(
      BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER,
    );
    expect(screen.queryByTestId("help-baseline-settings-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-baseline-settings-role-precondition")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-baseline-settings-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-baseline-settings-overview").textContent?.toLowerCase()).not.toContain(
      "skip this now",
    );
    expect(screen.getByTestId("help-baseline-settings-claim-discipline-strip")).toHaveTextContent(
      BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-baseline-settings",
      "help-baseline-settings-claim-discipline",
      BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      BASELINE_SETTINGS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();

    const sourcesRegion = within(screen.getByTestId("help-baseline-settings-sources"));
    for (const source of whereToGoNextFollowUpLinksForTests(
      BASELINE_SETTINGS_HELP_SOURCES,
      BASELINE_SETTINGS_HELP_CANONICAL_PATH,
    )) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(sourcesRegion.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.queryByRole("link", { name: "Assurance status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Baseline settings" })).not.toBeInTheDocument();

    for (const heading of BASELINE_SETTINGS_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
