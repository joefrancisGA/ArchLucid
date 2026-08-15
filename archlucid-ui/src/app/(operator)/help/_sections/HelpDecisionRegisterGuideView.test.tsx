import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpDecisionRegisterGuideView } from "@/app/(operator)/help/_sections/HelpDecisionRegisterGuideView";
import {
  DECISION_REGISTER_HELP_CATEGORY_EXAMPLE,
  DECISION_REGISTER_HELP_CLAIM_HEADING_ID,
  DECISION_REGISTER_HELP_CONFIDENCE_BASIS_EXAMPLE,
  DECISION_REGISTER_HELP_CONFIDENCE_EXAMPLE,
  DECISION_REGISTER_HELP_FIELD_EXAMPLES,
  DECISION_REGISTER_HELP_GUIDE_HEADINGS,
  DECISION_REGISTER_HELP_PRIMARY_ACTION,
  DECISION_REGISTER_HELP_START_HERE_CARD_TITLE,
  DECISION_REGISTER_HELP_START_HERE_HELPER,
  DECISION_REGISTER_HELP_START_HERE_PRECONDITION,
  DECISION_REGISTER_HELP_TILE_ITEMS,
} from "@/lib/decision-register-help-guide-content";
import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING,
  DECISION_REGISTER_HELP_SOURCES,
} from "@/lib/decision-register-help-evidence-copy";
import {
  DECISION_REGISTER_CATEGORY_LABEL,
  DECISION_REGISTER_CONFIDENCE_BASIS_LABEL,
} from "@/app/(operator)/governance/decision-register/decision-register-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpDecisionRegisterGuideView", () => {
  const entry = getProductDocumentationEntry("decision-register");

  it("renders provenance, start-here card, tag vocabulary, and readingBody", () => {
    if (entry === undefined) {
      throw new Error("Expected decision-register documentation entry.");
    }

    render(<HelpDecisionRegisterGuideView entry={entry} />);

    expect(screen.getByTestId("help-decision-register-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Guide last reviewed 2026-08-13 · governance decision register orientation",
    );
    expect(screen.getByTestId("help-decision-register-start-here-precondition")).toHaveTextContent(
      DECISION_REGISTER_HELP_START_HERE_PRECONDITION,
    );
    expect(screen.getByTestId("help-decision-register-start-here-helper")).toHaveTextContent(
      DECISION_REGISTER_HELP_START_HERE_HELPER,
    );
    expect(screen.queryByTestId("help-decision-register-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-decision-register-role-precondition")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-decision-register-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-decision-register-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-decision-register-claim-discipline").textContent).toContain(
      DECISION_REGISTER_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      DECISION_REGISTER_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: DECISION_REGISTER_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      DECISION_REGISTER_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: DECISION_REGISTER_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 2, name: DECISION_REGISTER_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();

    const tileItems = screen.getByTestId("help-decision-register-tile-items");

    for (const item of DECISION_REGISTER_HELP_TILE_ITEMS) {
      expect(within(tileItems).getByText(item.label)).toBeInTheDocument();
    }

    expect(screen.queryByText("Governance approval")).not.toBeInTheDocument();

    const fieldExamples = screen.getByTestId("help-decision-register-field-examples");

    for (const row of DECISION_REGISTER_HELP_FIELD_EXAMPLES) {
      expect(within(fieldExamples).getByText(row.fieldLabel)).toBeInTheDocument();
      expect(within(fieldExamples).getByText(row.exampleValue)).toBeInTheDocument();
    }

    expect(within(fieldExamples).getByText(DECISION_REGISTER_CATEGORY_LABEL)).toBeInTheDocument();
    expect(within(fieldExamples).getByText(DECISION_REGISTER_HELP_CATEGORY_EXAMPLE)).toBeInTheDocument();
    expect(within(fieldExamples).getByText(DECISION_REGISTER_CONFIDENCE_BASIS_LABEL)).toBeInTheDocument();
    expect(within(fieldExamples).getByText(DECISION_REGISTER_HELP_CONFIDENCE_BASIS_EXAMPLE)).toBeInTheDocument();
    expect(within(fieldExamples).getByText(DECISION_REGISTER_HELP_CONFIDENCE_EXAMPLE)).toBeInTheDocument();

    for (const source of DECISION_REGISTER_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: "Sealed review records" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Governance approval help" })).toBeInTheDocument();

    for (const heading of DECISION_REGISTER_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
