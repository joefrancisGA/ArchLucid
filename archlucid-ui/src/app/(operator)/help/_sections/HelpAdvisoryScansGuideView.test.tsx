import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpAdvisoryScansGuideView } from "@/app/(operator)/help/_sections/HelpAdvisoryScansGuideView";
import {
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
} from "@/lib/advisory-copy";
import {
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE,
  ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE_HEADING,
  ADVISORY_SCANS_HELP_SOURCES,
} from "@/lib/advisory-scans-help-evidence-copy";
import {
  ADVISORY_SCANS_HELP_BEFORE_YOU_START_TITLE,
  ADVISORY_SCANS_HELP_CLAIM_HEADING_ID,
  ADVISORY_SCANS_HELP_DISPOSITION_AUDIT_NOTE,
  ADVISORY_SCANS_HELP_DISPOSITION_SECTION_TITLE,
  ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK,
  ADVISORY_SCANS_HELP_GUIDE_HEADINGS,
  ADVISORY_SCANS_HELP_HOW_DERIVATION_SENTENCE,
  ADVISORY_SCANS_HELP_OUTPUT_FIELDS,
  ADVISORY_SCANS_HELP_PAGE_EYEBROW,
  ADVISORY_SCANS_HELP_PRIMARY_ACTION,
  ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE,
  ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK,
  ADVISORY_SCANS_HELP_START_HERE_ROLE_LINK,
  ADVISORY_SCANS_HELP_START_HERE_SCOPE_NOTE,
  ADVISORY_SCANS_HELP_SUMMARY_METRICS,
  ADVISORY_SCANS_HELP_TILE_ITEMS,
} from "@/lib/advisory-scans-help-guide-content";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAdvisoryScansGuideView", () => {
  const entry = getProductDocumentationEntry("advisory-scans");

  it("renders provenance, preconditions, readingBody, and buyer-language claim discipline", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    expect(screen.getByTestId("help-advisory-scans-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-heading-eyebrow")).toHaveTextContent(ADVISORY_SCANS_HELP_PAGE_EYEBROW);
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-08-13");
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
      ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY,
    );
    expect(ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE).toBe(ADVISORY_SCANS_INLINE_CAPABILITY_BOUNDARY);
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
    expect(screen.getByRole("heading", { name: ADVISORY_SCANS_HELP_BEFORE_YOU_START_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK.label })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_SAMPLE_RECOMMENDATION_LINK.href,
    );
    expect(screen.getByRole("heading", { name: "What advisory scans show" }).className).toContain(
      OPERATOR_TYPOGRAPHY.sectionTitle.split(" ")[0],
    );
    expect(screen.getByRole("heading", { name: ADVISORY_SCANS_HELP_RELATED_GOVERNANCE_SURFACES_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-advisory-scans-how-derivation")).toHaveTextContent(
      ADVISORY_SCANS_HELP_HOW_DERIVATION_SENTENCE,
    );
    expect(screen.getByTestId("help-advisory-scans-ai-usage-disclosure")).toBeInTheDocument();
  });

  it("renders product-parity field labels and scan summary metrics", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    for (const field of ADVISORY_SCANS_HELP_OUTPUT_FIELDS) {
      expect(screen.getByText(field.label)).toBeInTheDocument();
      expect(screen.getByText(field.detail)).toBeInTheDocument();
    }

    const summaryRegion = screen.getByTestId("help-advisory-scans-summary-metrics");

    for (const metric of ADVISORY_SCANS_HELP_SUMMARY_METRICS) {
      expect(within(summaryRegion).getByText(metric.label)).toBeInTheDocument();
      expect(within(summaryRegion).getByText(metric.detail)).toBeInTheDocument();
    }
  });

  it("renders disposition guidance with hub action label parity", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    expect(screen.getByRole("heading", { name: ADVISORY_SCANS_HELP_DISPOSITION_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-advisory-scans-disposition-audit-note")).toHaveTextContent(
      ADVISORY_SCANS_HELP_DISPOSITION_AUDIT_NOTE,
    );

    const dispositionRegion = screen.getByTestId("help-advisory-scans-disposition-actions");
    const expectedLabels = [
      ADVISORY_SCANS_DISPOSITION_ACCEPT,
      ADVISORY_SCANS_DISPOSITION_DEFER,
      ADVISORY_SCANS_DISPOSITION_REJECT,
      ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
    ];

    for (const label of expectedLabels) {
      expect(within(dispositionRegion).getByText(label)).toBeInTheDocument();
    }
  });

  it("renders related governance links as a list and dedupes stepper destinations", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    const tileList = screen.getByTestId("help-advisory-scans-tile-items");
    expect(tileList.tagName).toBe("UL");

    for (const item of ADVISORY_SCANS_HELP_TILE_ITEMS) {
      expect(within(tileList).getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    expect(screen.queryByRole("link", { name: "findings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "audit" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.label })).toHaveAttribute(
      "href",
      ADVISORY_SCANS_HELP_FINALIZE_REVIEW_LINK.href,
    );
    expect(screen.getByRole("link", { name: "Schedules tab" })).toHaveAttribute("href", ADVISORY_SCANS_SCHEDULES_HREF);

    const schedulesLinks = screen.getAllByRole("link", { name: "Schedules" });
    const findingsLinks = screen.getAllByRole("link", { name: "Findings triage" });
    const auditLinks = screen.getAllByRole("link", { name: "Audit trail" });

    expect(schedulesLinks.length).toBeLessThanOrEqual(2);
    expect(findingsLinks.length).toBeLessThanOrEqual(2);
    expect(auditLinks.length).toBeLessThanOrEqual(2);
  });

  it("resolves TOC anchors with sticky scroll offsets and stacked sources", () => {
    if (entry === undefined) {
      throw new Error("Expected advisory-scans documentation entry.");
    }

    render(<HelpAdvisoryScansGuideView entry={entry} />);

    for (const heading of ADVISORY_SCANS_HELP_GUIDE_HEADINGS) {
      const resolved = screen.getByRole("heading", { name: heading.title });
      expect(resolved).toHaveAttribute("id", heading.id);
      expect(resolved.className).toContain(OPERATOR_SHELL_SCROLL_OFFSET_CLASS.split(" ")[0]);
    }

    for (const source of ADVISORY_SCANS_HELP_SOURCES) {
      expect(
        screen.getByRole("link", {
          name: formatHelpFollowUpLinkAccessibleName(source.href, source.label),
        }),
      ).toHaveAttribute("href", source.href);
    }

    expect(screen.getByRole("link", { name: "Read AI usage help" })).toHaveAttribute("href", "/help/ai-usage");
    expect(screen.queryByRole("link", { name: "Architecture reviews" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Scan generation" })).not.toBeInTheDocument();
  });
});
