import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

import { HelpPolicyPackDeltaDemoGuideView } from "@/app/(operator)/help/_sections/HelpPolicyPackDeltaDemoGuideView";
import {
  POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
  POLICY_PACK_DELTA_DEMO_HELP_GUIDE_HEADINGS,
  POLICY_PACK_DELTA_DEMO_HELP_HELP_RETURN,
  POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS,
  POLICY_PACK_DELTA_DEMO_HELP_RELATED_LINKS,
} from "@/lib/policy/policy-pack-delta-demo-help-guide-content";
import {
  POLICY_PACK_DELTA_DEMO_HELP_GUIDE_TEST_ID,
  POLICY_PACK_DELTA_DEMO_HELP_SKIP_LINK_LABEL,
  POLICY_PACK_DELTA_DEMO_HELP_SKIP_TARGET_ID,
} from "@/lib/policy/policy-pack-delta-demo-help-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpPolicyPackDeltaDemoGuideView (HPO Phase 2)", () => {
  const entry = getProductDocumentationEntry("policy-pack-delta-demo");

  it("renders breadcrumb, header claim discipline, applicability, error recovery, and related links", () => {
    if (entry === undefined) {
      throw new Error("Expected policy-pack-delta-demo documentation entry.");
    }

    render(<HelpPolicyPackDeltaDemoGuideView entry={entry} markdown="# Reference\n\n| Column | Value |\n| --- | --- |" />);

    expect(screen.getByTestId(POLICY_PACK_DELTA_DEMO_HELP_GUIDE_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toHaveTextContent("Policy-pack delta demo");
    expect(screen.getByTestId("help-policy-pack-delta-demo-page-title")).toHaveTextContent(
      POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE,
    );
    expect(screen.getByRole("link", { name: POLICY_PACK_DELTA_DEMO_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${POLICY_PACK_DELTA_DEMO_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-policy-pack-delta-demo-header-claim-discipline")).toHaveTextContent(
      POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-policy-pack-delta-demo-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-policy-pack-delta-demo-wk21-honesty")).not.toBeInTheDocument();
    expect(screen.queryByText(/Before sponsor send/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("help-policy-pack-delta-demo-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);

    for (const heading of POLICY_PACK_DELTA_DEMO_HELP_GUIDE_HEADINGS) {
      const element = document.getElementById(heading.id);
      expect(element).not.toBeNull();
      expect(element).toHaveTextContent(heading.title);
    }

    expect(screen.getByTestId("help-policy-pack-delta-demo-applicability")).toBeInTheDocument();
    expect(screen.getByTestId("help-policy-pack-delta-demo-error-recovery")).toBeInTheDocument();

    const actionPanel = screen.getByTestId("help-policy-pack-delta-demo-action-panel");
    expect(
      within(actionPanel).getByRole("link", {
        name: POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.label,
      }),
    ).toHaveAttribute("href", POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.href);

    const related = screen.getByTestId("help-policy-pack-delta-demo-related-topics");
    for (const topic of POLICY_PACK_DELTA_DEMO_HELP_RELATED_LINKS) {
      expect(within(related).getByRole("link", { name: topic.label })).toHaveAttribute("href", topic.href);
    }

    expect(screen.getByTestId("help-policy-pack-delta-demo-return-to-help")).toHaveAttribute(
      "href",
      POLICY_PACK_DELTA_DEMO_HELP_HELP_RETURN.href,
    );
  });
});
