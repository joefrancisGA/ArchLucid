import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const mockSearchParams = vi.hoisted(() => new URLSearchParams(""));
const mockProductLine = vi.hoisted(() => ({ productLine: "architecture" as const }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/impact-preview-vs-architecture-envelope",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => mockProductLine,
}));

import { HelpImpactPreviewVsArchitectureEnvelopeGuideView } from "@/app/(operator)/help/_sections/HelpImpactPreviewVsArchitectureEnvelopeGuideView";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-evidence-copy";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SECURENOW_APPLICABILITY_TAG,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOC_JUMP_HINT,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-guide-content";
import {
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL,
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID,
} from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpImpactPreviewVsArchitectureEnvelopeGuideView (CE-020 / EIM Phase 1)", () => {
  const entry = getProductDocumentationEntry("impact-preview-vs-architecture-envelope");

  it("renders breadcrumb, quiet provenance, first-viewport comparison, safety callout, and merged related links", () => {
    if (entry === undefined) {
      throw new Error("Expected impact-preview-vs-architecture-envelope documentation entry.");
    }

    mockProductLine.productLine = "architecture";

    render(<HelpImpactPreviewVsArchitectureEnvelopeGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-impact-preview-vs-envelope-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Impact preview vs architecture envelope");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-page-title")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE,
    );
    expect(screen.getByText(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).not.toHaveTextContent("CE-020");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-header-claim-discipline")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-impact-preview-vs-envelope-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-securenow-callout")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-impact-preview-vs-envelope-safety-callout")).toHaveTextContent("sealed review record");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-policy-status-chip")).toHaveTextContent("Policy analysis");
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-policy-status-tag")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-impact-preview-vs-envelope-seat-working")).toBeInTheDocument();
    expect(screen.getByTestId("help-impact-preview-vs-envelope-record-practice")).toHaveTextContent("Practice");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-record-practice")).toHaveTextContent("Record");

    for (const heading of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const table = screen.getByTestId("help-impact-preview-vs-envelope-comparison-table");
    expect(within(table).getAllByRole("row").length).toBe(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_COMPARISON_ROWS.length + 2,
    );
    expect(screen.getByTestId("help-impact-preview-vs-envelope-open-impact-preview")).toHaveAttribute(
      "href",
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS[0]?.workspaceHref,
    );
    expect(screen.getByTestId("help-impact-preview-vs-envelope-open-sketch-reviews")).toHaveAttribute(
      "href",
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OPEN_WORKSPACE_PATHS[1]?.workspaceHref,
    );
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-contrasted-paths")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-r12")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-sources")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-return-to-help")).not.toBeInTheDocument();

    expect(screen.getByTestId("help-impact-preview-vs-envelope-technical-mapping")).toHaveTextContent("R12");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-technical-mapping")).toHaveTextContent("CE-020");
    expect(screen.getByTestId("help-impact-preview-vs-envelope-technical-mapping")).toHaveTextContent("ADR 0092");
    expect(screen.getByRole("link", { name: "ADR 0092" })).toHaveAttribute("href", "/help/sketch-a-change");

    const related = screen.getByTestId("help-impact-preview-vs-envelope-related-topics");
    for (const topic of CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-impact-preview-vs-envelope-toc-jump-hint")).toHaveTextContent(
      CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOC_JUMP_HINT,
    );
    expect(screen.getByTestId("help-impact-preview-vs-envelope-section-anchor-help-impact-preview-vs-envelope-comparison")).toHaveAttribute(
      "href",
      "#help-impact-preview-vs-envelope-comparison",
    );

    const sponsorPanel = screen.getByTestId("help-impact-preview-vs-envelope-honesty-panel");
    expect(related.compareDocumentPosition(sponsorPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("HelpImpactPreviewVsArchitectureEnvelopeGuideView SecureNow shell", () => {
  it("leads with Architecture-only applicability before overview", () => {
    const entry = getProductDocumentationEntry("impact-preview-vs-architecture-envelope");

    if (entry === undefined) {
      throw new Error("Expected impact-preview-vs-architecture-envelope documentation entry.");
    }

    mockProductLine.productLine = "security";

    render(<HelpImpactPreviewVsArchitectureEnvelopeGuideView entry={entry} />);

    const callout = screen.getByTestId("help-impact-preview-vs-envelope-securenow-callout");
    const overview = screen.getByTestId("help-impact-preview-vs-envelope-overview");

    expect(callout).toHaveTextContent(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SECURENOW_APPLICABILITY_TAG);
    expect(callout).toHaveTextContent(CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_APPLICABILITY_SECURENOW);
    expect(callout.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId("help-impact-preview-vs-envelope-seat-securenow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-impact-preview-vs-envelope-open-sketch-reviews")).toHaveTextContent(
      "Architecture product",
    );
  });
});

describe("HelpImpactPreviewVsArchitectureEnvelopeGuideView returnTo", () => {
  it("renders Back to architecture desk when returnTo targets a review route", () => {
    const entry = getProductDocumentationEntry("impact-preview-vs-architecture-envelope");

    if (entry === undefined) {
      throw new Error("Expected impact-preview-vs-architecture-envelope documentation entry.");
    }

    mockProductLine.productLine = "architecture";
    mockSearchParams.set("returnTo", "/architecture/reviews/run-1?reviewTab=overview");

    render(<HelpImpactPreviewVsArchitectureEnvelopeGuideView entry={entry} />);

    expect(screen.getByTestId("help-impact-preview-vs-envelope-return-to-desk")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1?reviewTab=overview",
    );

    mockSearchParams.delete("returnTo");
  });
});
