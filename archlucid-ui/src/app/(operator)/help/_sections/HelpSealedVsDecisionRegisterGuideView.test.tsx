import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpSealedVsDecisionRegisterGuideView } from "@/app/(operator)/help/_sections/HelpSealedVsDecisionRegisterGuideView";
import {
  DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_DISCIPLINE,
  DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS,
  DESK_IA_HELP_SEALED_VS_REGISTER_HELP_RETURN,
  DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS,
  DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_LINKS,
  DESK_IA_HELP_SEALED_VS_REGISTER_SEAL_PROOFS,
  DESK_IA_HELP_SEALED_VS_REGISTER_TITLE,
  DESK_IA_HELP_SEALED_VS_REGISTER_TOPIC_LABEL,
} from "@/lib/desk-ia-sealed-vs-decision-register-help-guide-content";
import {
  DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_TEST_ID,
  DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_LINK_LABEL,
  DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_TARGET_ID,
} from "@/lib/desk-ia-sealed-vs-decision-register-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpSealedVsDecisionRegisterGuideView (DI-023 / SEX Phase 2)", () => {
  const entry = getProductDocumentationEntry("sealed-record-vs-decision-register");

  it("renders breadcrumb, provenance, skip link, primary actions, seal proofs, headings, and related links without honesty panel", () => {
    if (entry === undefined) {
      throw new Error("Expected sealed-record-vs-decision-register documentation entry.");
    }

    render(<HelpSealedVsDecisionRegisterGuideView entry={entry} />);

    expect(screen.getByTestId(DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent(DESK_IA_HELP_SEALED_VS_REGISTER_TOPIC_LABEL);
    expect(screen.getByTestId("help-sealed-vs-decision-register-page-title")).toHaveTextContent(
      DESK_IA_HELP_SEALED_VS_REGISTER_TITLE,
    );
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent("Guide last reviewed 2026-09-12");
    expect(screen.getByTestId("help-sealed-vs-decision-register-header-claim-discipline")).toHaveTextContent(
      DESK_IA_HELP_SEALED_VS_REGISTER_CLAIM_DISCIPLINE,
    );
    expect(screen.getByRole("link", { name: DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${DESK_IA_HELP_SEALED_VS_REGISTER_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-sealed-vs-decision-register-overview").className).toContain(
      HELP_PAGE_LAYOUT.readingBody,
    );
    expect(screen.getByTestId("help-sealed-vs-decision-register-claim-tag")).toBeInTheDocument();

    expect(screen.getByTestId("help-sealed-vs-decision-register-open-sealed-records")).toHaveAttribute(
      "href",
      DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS.sealedRecords.href,
    );
    expect(screen.getByTestId("help-sealed-vs-decision-register-open-decision-register")).toHaveAttribute(
      "href",
      DESK_IA_HELP_SEALED_VS_REGISTER_PRIMARY_ACTIONS.decisionRegister.href,
    );

    for (const proof of DESK_IA_HELP_SEALED_VS_REGISTER_SEAL_PROOFS) {
      expect(screen.getByText(proof)).toBeInTheDocument();
    }

    for (const heading of DESK_IA_HELP_SEALED_VS_REGISTER_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    const related = screen.getByTestId("help-sealed-vs-decision-register-related-topics");
    for (const topic of DESK_IA_HELP_SEALED_VS_REGISTER_RELATED_LINKS) {
      if (topic.href.startsWith("/help/")) {
        expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
      }
    }

    expect(screen.getByTestId("help-sealed-vs-decision-register-return-to-help")).toHaveAttribute(
      "href",
      DESK_IA_HELP_SEALED_VS_REGISTER_HELP_RETURN.href,
    );

    expect(screen.queryByTestId("help-sealed-vs-decision-register-honesty-panel")).not.toBeInTheDocument();
  });
});
