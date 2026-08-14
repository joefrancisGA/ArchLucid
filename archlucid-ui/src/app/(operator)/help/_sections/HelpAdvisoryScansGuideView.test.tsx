import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpAdvisoryScansGuideView } from "@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView";
import {
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  ADVISORY_SCANS_HELP_SOURCES,
} from "@/lib/advisory-scans-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
  ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK,
  ADVISORY_SCANS_HELP_OUTPUT_FIELDS,
  ADVISORY_SCANS_HELP_PAGE_EYEBROW,
  ADVISORY_SCANS_HELP_PRIMARY_ACTION,
  ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE,
  ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK,
  ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
} from "@/lib/advisory-scans-help-guide-content";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAdvisoryScansGuideView", () => {
  const entry = getProductDocumentationEntry("advisory-scans");

  it("renders provenance, role precondition, readingBody, and claim discipline heading", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    expect(screen.getByTestId("help-advisory-scans-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-heading-eyebrow")).toHaveTextContent(ADVISORY_SCANS_HELP_PAGE_EYEBROW);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Last reviewed 2026-08-13");
    expect(screen.getByTestId("help-advisory-scans-start-here-scope-note")).toHaveTextContent(
      ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE,
    );
    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK.label })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK.href,
    );
    expect(screen.queryByTestId("help-advisory-scans-role-precondition-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-advisory-scans-start-here-scope-note").textContent?.toLowerCase()).not.toContain("now");
    expect(screen.getByTestId("help-advisory-scans-start-here-scope-note").textContent?.toLowerCase()).not.toContain(
      "executions",
    );
    expect(screen.getByRole("heading", { name: ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByTestId("help-advisory-scans-claim-discipline").textContent).toContain(
      ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-advisory-scans-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-advisory-scans-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getByRole("link", { name: "Audit trail" })).toHaveAttribute("href", GOVERNANCE_AUDIT_PATH);
    expect(screen.getAllByRole("link", { name: ADVISORY_SCANS_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Start here" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What advisory scans show" }).className).toContain(
      OPERATOR_TYPOGRAPHY.sectionTitle.split(" ")[0],
    );
    expect(screen.getByRole("heading", { name: ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE })).toBeInTheDocument();

    for (const field of ADVISORY_SCANS_HELP_OUTPUT_FIELDS) {
      expect(screen.getByText(field.label)).toBeInTheDocument();
      expect(screen.getByText(field.detail)).toBeInTheDocument();
    }

    for (const item of ADVISORY_SCANS_HELP_TILE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    for (const source of ADVISORY_SCANS_HELP_SOURCES) {
      expect(
        screen.getByRole("link", {
          name: formatHelpFollowUpLinkAccessibleName(source.href, source.label),
        }),
      ).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: "Read AI usage help" })).toHaveAttribute("href", "/help/ai-usage");
    expect(screen.queryByRole("link", { name: "Audit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Architecture reviews" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Scan generation" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.label })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.href,
    );
    expect(screen.getByRole("link", { name: "Schedules tab" })).toHaveAttribute("href", ADVISORY_SCANS_SCHEDULES_HREF);
    expect(screen.getByRole("link", { name: "findings" })).toHaveAttribute("href", GOVERNANCE_FINDINGS_PATH);
    expect(screen.getByRole("link", { name: "audit" })).toHaveAttribute("href", GOVERNANCE_AUDIT_PATH);
  });
});
