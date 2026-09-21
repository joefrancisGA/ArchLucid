import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpInspectStoredEvidenceGuideView } from "@/app/(operator)/help/_sections/HelpInspectStoredEvidenceGuideView";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_CLAIM_DISCIPLINE } from "@/lib/evidence-source-inspect-help-stored-evidence-evidence-copy";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_HELP_RETURN,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE,
} from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import {
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_LINK_LABEL,
  EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SKIP_TARGET_ID,
} from "@/lib/evidence-source-inspect-help-stored-evidence-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpInspectStoredEvidenceGuideView (ESI-08 / EIN Phase 2)", () => {
  const entry = getProductDocumentationEntry("inspect-stored-evidence");

  it("renders provenance, skip link, evidence guidance sections, and no sponsor send panel", () => {
    if (entry === undefined) {
      throw new Error("Expected inspect-stored-evidence documentation entry.");
    }

    render(<HelpInspectStoredEvidenceGuideView entry={entry} markdown="# discarded" />);

    expect(screen.getByTestId("help-inspect-stored-evidence-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-inspect-stored-evidence-page-title")).toHaveTextContent(
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_TITLE,
    );
    expect(screen.getByText(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("ESI-08");
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
    expect(screen.getByTestId("help-inspect-stored-evidence-audit")).toHaveTextContent("EvidenceSourceOpened");
    expect(screen.getByTestId("help-inspect-stored-evidence-controls")).toHaveTextContent("no separate Open button");

    for (const heading of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const purposeLinks = screen.getByTestId("help-inspect-stored-evidence-purpose-links");
    expect(within(purposeLinks).getByRole("link", { name: "Evidence intake" })).toHaveAttribute(
      "href",
      "/help/evidence-intake",
    );

    const related = screen.getByTestId("help-inspect-stored-evidence-related-topics");
    for (const topic of EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_RELATED_TOPICS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-inspect-stored-evidence-return-to-help")).toHaveAttribute(
      "href",
      EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_HELP_RETURN.href,
    );
  });
});
