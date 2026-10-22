import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/product-line/resolve-product-line-id", () => ({
  resolveProductLineIdFromEnv: () => "architecture",
}));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => "architecture-identity-001",
}));

import { HelpSystemGravityGuideView } from "@/app/(operator)/help/_sections/HelpSystemGravityGuideView";
import {
  SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE,
  SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS,
  SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK,
  SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS,
  SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS,
  SYSTEM_GRAVITY_HELP_RELATED_LINKS,
  SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
  SYSTEM_GRAVITY_HELP_TITLE,
  SYSTEM_GRAVITY_HELP_TOPIC_LABEL,
} from "@/lib/system-gravity-help-guide-content";
import {
  SYSTEM_GRAVITY_HELP_GUIDE_TEST_ID,
  SYSTEM_GRAVITY_HELP_SKIP_LINK_LABEL,
  SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID,
} from "@/lib/system-gravity-help-page-copy";
import { WORKING_CAREER_DOOR_LABEL, WORKING_REHEARSAL_DOOR_LABEL } from "@/lib/governance/working-career-rehearsal-door-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSystemGravityGuideView (SG-107 / HSY Phase 2)", () => {
  const entry = getProductDocumentationEntry("system-gravity");

  it("renders breadcrumb, provenance, skip link, key terms, recovery, keyboard table, and technical disclosure", () => {
    if (entry === undefined) {
      throw new Error("Expected system-gravity documentation entry.");
    }

    render(<HelpSystemGravityGuideView entry={entry} />);

    expect(screen.getByTestId(SYSTEM_GRAVITY_HELP_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(SYSTEM_GRAVITY_HELP_TOPIC_LABEL);
    expect(screen.getByTestId("help-system-gravity-page-title")).toHaveTextContent(SYSTEM_GRAVITY_HELP_TITLE);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-system-gravity-header-claim-discipline")).toHaveTextContent(
      SYSTEM_GRAVITY_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: SYSTEM_GRAVITY_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SYSTEM_GRAVITY_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-system-gravity-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByTestId("help-system-gravity-concept-tiles")).not.toBeInTheDocument();

    const definitions = screen.getByTestId("help-system-gravity-desk-home-definitions");
    for (const row of SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS) {
      expect(within(definitions).getByText(row.term)).toBeInTheDocument();
      expect(within(definitions).getByText(row.definition)).toBeInTheDocument();
    }

    for (const heading of SYSTEM_GRAVITY_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const keyboardTable = screen.getByTestId("help-system-gravity-keyboard-table");
    for (const row of SYSTEM_GRAVITY_HELP_KEYBOARD_ROWS) {
      expect(within(keyboardTable).getByText(row.keys)).toBeInTheDocument();
      expect(within(keyboardTable).getByText(row.action)).toBeInTheDocument();
    }

    const technical = screen.getByTestId("help-system-gravity-technical-reference");
    for (const identifier of SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS) {
      expect(within(technical).getByText(identifier)).toBeInTheDocument();
    }

    const related = screen.getByTestId("help-system-gravity-related-topics");
    for (const topic of SYSTEM_GRAVITY_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-system-gravity-recover-architecture-list")).toHaveAttribute(
      "href",
      SYSTEM_GRAVITY_HELP_ERROR_RECOVERY_ARCHITECTURE_LIST_LINK.href,
    );
    expect(screen.getByTestId("help-system-gravity-recover-last-architecture")).toHaveAttribute(
      "href",
      "/architecture/architectures/architecture-identity-001",
    );
    expect(screen.getByTestId("help-system-gravity-trust-link-0")).toHaveAttribute(
      "href",
      "/help/sealed-record-vs-decision-register",
    );
    expect(screen.getByTestId("help-system-gravity-trust-link-1")).toHaveAttribute("href", "/help/audit-trail");
    expect(screen.getByTestId("help-system-gravity-record-what-if-cap-link")).toHaveAttribute(
      "href",
      "/help/sketch-a-change",
    );

    expect(screen.getByTestId("help-system-gravity-record-practice-intro")).toHaveTextContent(
      WORKING_CAREER_DOOR_LABEL,
    );
    expect(screen.getByTestId("help-system-gravity-record-practice-intro")).toHaveTextContent(
      WORKING_REHEARSAL_DOOR_LABEL,
    );
    expect(screen.getByTestId("help-system-gravity-record-practice-record-tag")).toHaveTextContent(
      WORKING_CAREER_DOOR_LABEL,
    );
    expect(screen.getByTestId("help-system-gravity-record-practice-practice-tag")).toHaveTextContent(
      WORKING_REHEARSAL_DOOR_LABEL,
    );
    expect(screen.getByTestId("help-system-gravity-record-effects-tag")).toHaveTextContent(WORKING_CAREER_DOOR_LABEL);
    expect(screen.getByTestId("help-system-gravity-practice-effects-tag")).toHaveTextContent(
      WORKING_REHEARSAL_DOOR_LABEL,
    );
  });
});
