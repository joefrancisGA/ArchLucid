import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpBaselineSettingsGuideView } from "@/app/(operator)/help/_sections/HelpBaselineSettingsGuideView";
import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_ROLE_PRECONDITION,
  BASELINE_SETTINGS_HELP_ROLE_PRECONDITION_TAG,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
} from "@/lib/baseline-settings-help-guide-content";
import { BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER } from "@/lib/baseline-settings-present";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpBaselineSettingsGuideView", () => {
  const entry = getProductDocumentationEntry("baseline-settings");

  it("renders breadcrumb, provenance, saved-baseline warn, role precondition, and readingBody", () => {
    if (entry === undefined) {
      throw new Error("Expected baseline-settings documentation entry.");
    }

    render(<HelpBaselineSettingsGuideView entry={entry} />);

    expect(screen.getByTestId("help-baseline-settings-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(
      HELP_TOPIC_BREADCRUMB_HUB_LABEL,
    );
    expect(screen.getByRole("link", { name: HELP_TOPIC_BREADCRUMB_HUB_LABEL })).toHaveAttribute("href", "/help");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Last reviewed 2026-08-13 · administration baseline settings orientation",
    );
    expect(screen.getByTestId("help-baseline-settings-saved-baseline-warn")).toHaveTextContent(
      BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER,
    );
    expect(screen.getByTestId("help-baseline-settings-role-precondition")).toHaveTextContent(
      BASELINE_SETTINGS_HELP_ROLE_PRECONDITION,
    );
    expect(screen.getByTestId("help-baseline-settings-role-precondition-tag")).toHaveTextContent(
      BASELINE_SETTINGS_HELP_ROLE_PRECONDITION_TAG,
    );
    expect(screen.getByTestId("help-baseline-settings-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-baseline-settings-overview").textContent?.toLowerCase()).not.toContain(
      "skip this now",
    );
    expect(screen.getByTestId("help-baseline-settings-claim-discipline").textContent).toContain(
      BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("link", { name: BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      BASELINE_SETTINGS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(
      BASELINE_SETTINGS_HELP_BREADCRUMB_TOPIC_TITLE,
    );

    for (const source of BASELINE_SETTINGS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.queryByRole("link", { name: "Assurance status" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Baseline settings" })).not.toBeInTheDocument();
  });
});
