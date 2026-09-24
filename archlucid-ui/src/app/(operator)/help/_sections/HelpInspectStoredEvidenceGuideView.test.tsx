import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

const mockSearchParams = vi.hoisted(() => new URLSearchParams(""));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/inspect-stored-evidence",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

import { HelpInspectStoredEvidenceGuideView } from "@/app/(operator)/help/_sections/HelpInspectStoredEvidenceGuideView";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE } from "@/lib/evidence-source-inspect-help-stored-evidence-evidence-copy";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_LINKS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_LINK_LABEL,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_TARGET_ID,
} from "@/lib/evidence-source-inspect-help-stored-evidence-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpInspectStoredEvidenceGuideView (ESI-08 / EIN Phase 1)", () => {
  const entry = getProductDocumentationEntry("inspect-stored-evidence");

  it("renders breadcrumb, provenance, safety callout, technical reference, and merged related links", () => {
    if (entry === undefined) {
      throw new Error("Expected inspect-stored-evidence documentation entry.");
    }

    render(<HelpInspectStoredEvidenceGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-inspect-stored-evidence-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Inspect stored evidence");
    expect(screen.getByTestId("help-inspect-stored-evidence-page-title")).toHaveTextContent(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE,
    );
    expect(screen.getByText(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-inspect-stored-evidence-provenance-footer")).toHaveTextContent(
      "Guide last reviewed 2026-09-12",
    );
    expect(screen.getByTestId("help-inspect-stored-evidence-provenance-footer")).toHaveTextContent("ESI-08");
    expect(screen.getByTestId("help-inspect-stored-evidence-source-doc-path")).toHaveTextContent("Source:");
    expect(screen.getByTestId("help-inspect-stored-evidence-header-claim-discipline")).toHaveTextContent(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE,
    );
    expect(
      screen.getByRole("link", { name: EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_LINK_LABEL }),
    ).toHaveAttribute("href", `#${EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_TARGET_ID}`);
    expect(screen.getByTestId("help-inspect-stored-evidence-overview").className).toContain(
      HELP_PAGE_LAYOUT.readingBody,
    );
    expect(screen.queryByText("# discarded")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-inspect-stored-evidence-honesty-panel")).not.toBeInTheDocument();
    expect(screen.queryByText(/Before sponsor send/i)).not.toBeInTheDocument();

    expect(screen.getByTestId("help-inspect-stored-evidence-safety-callout")).toHaveTextContent(
      "not the sealed review record",
    );
    expect(screen.getByTestId("help-inspect-stored-evidence-safety-status-tag")).toHaveTextContent(
      "Not sealed package proof",
    );
    expect(screen.getByTestId("help-topic-print-pdf")).toBeInTheDocument();
    expect(screen.getByTestId("help-inspect-stored-evidence-audit")).not.toHaveTextContent("EvidenceSourceOpened");
    expect(screen.getByTestId("help-inspect-stored-evidence-controls")).toHaveTextContent("no separate Open button");
    expect(screen.getByTestId("help-inspect-stored-evidence-technical-reference")).toBeInTheDocument();
    expect(screen.getByTestId("help-inspect-stored-evidence-preview-keyboard-table")).toBeInTheDocument();

    expect(screen.queryByTestId("help-inspect-stored-evidence-purpose-links")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-inspect-stored-evidence-sources")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-inspect-stored-evidence-return-to-help")).not.toBeInTheDocument();

    for (const heading of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-inspect-stored-evidence-related-topics");
    expect(screen.getByTestId("help-inspect-stored-evidence-related-review-workflow")).toBeInTheDocument();
    for (const topic of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    const openReviews = screen.getByTestId(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.testId);
    expect(openReviews).toHaveAttribute("href", EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.href);
    expect(openReviews.className).not.toMatch(/bg-al-primary|bg-primary/);
  });
});

describe("HelpInspectStoredEvidenceGuideView returnTo", () => {
  it("renders Back to review evidence when returnTo targets the Evidence tab", () => {
    const entry = getProductDocumentationEntry("inspect-stored-evidence");

    if (entry === undefined) {
      throw new Error("Expected inspect-stored-evidence documentation entry.");
    }

    mockSearchParams.set(
      "returnTo",
      "/architecture/reviews/run-1?reviewTab=evidence",
    );

    render(<HelpInspectStoredEvidenceGuideView entry={entry} />);

    const returnButton = screen.getByTestId("help-inspect-stored-evidence-return-to-review-evidence");
    expect(returnButton.tagName.toLowerCase()).toBe("a");
    expect(returnButton).toHaveAttribute("href", "/architecture/reviews/run-1?reviewTab=evidence");

    mockSearchParams.delete("returnTo");
  });

  it("ignores invalid returnTo values", () => {
    const entry = getProductDocumentationEntry("inspect-stored-evidence");

    if (entry === undefined) {
      throw new Error("Expected inspect-stored-evidence documentation entry.");
    }

    mockSearchParams.set("returnTo", "/governance/findings");

    render(<HelpInspectStoredEvidenceGuideView entry={entry} />);

    expect(screen.queryByTestId("help-inspect-stored-evidence-return-to-review-evidence")).not.toBeInTheDocument();

    mockSearchParams.delete("returnTo");
  });
});
