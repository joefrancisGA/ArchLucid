import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button">Help</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/policy-pack-delta-demo",
}));

import { HelpPolicyPackDeltaDemoGuideView } from "@/app/(operator)/help/_sections/HelpPolicyPackDeltaDemoGuideView";
import {
  POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
  POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS,
} from "@/lib/policy/policy-pack-delta-demo-help-guide-content";
import { expectClaimDisciplineBandContent } from "@/lib/claim-discipline-test-helpers";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPolicyPackDeltaDemoGuideView (standalone internal runbook)", () => {
  const loaded = tryLoadProductDocumentation("policy-pack-delta-demo");

  it("serves policy-pack-delta-demo on its canonical help route", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe("Policy-pack delta demo (internal runbook)");
  });

  it("renders specialty demo chrome without HTTP/script leakage (TB-1726 / TB-1727)", () => {
    if (loaded === null) {
      throw new Error("Expected policy-pack-delta-demo documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "policy-pack-delta-demo",
    });

    render(<HelpPolicyPackDeltaDemoGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("demo-policy-pack-delta");
    expect(preparedMarkdown.toLowerCase()).not.toContain("precommitgateenabled");
    expect(preparedMarkdown.toLowerCase()).not.toContain("/v1/");
    expect(visible).toContain("policy packs");
    expect(screen.getByTestId("help-policy-pack-delta-demo-guide")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-policy-pack-delta-demo-narrative-arc")).toBeInTheDocument();
    expect(screen.queryByTestId("help-policy-pack-delta-demo-claim-discipline")).toBeNull();
    expect(screen.getByTestId("help-policy-pack-delta-demo-claim-discipline-strip")).toHaveTextContent(
      POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE,
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-policy-pack-delta-demo",
      "help-policy-pack-delta-demo-claim-discipline",
      POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const actionPanel = screen.getByTestId("help-policy-pack-delta-demo-action-panel");
    const narrativeArc = screen.getByTestId("help-policy-pack-delta-demo-narrative-arc");

    expect(narrativeArc.compareDocumentPosition(actionPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(actionPanel.className).not.toMatch(/bg-teal-/);
    expect(actionPanel.className).not.toMatch(/border-teal-/);

    expect(
      within(actionPanel).getByRole("link", {
        name: POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.label,
      }),
    ).toHaveAttribute("href", POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS.openPolicyPacks.href);

    expect(screen.queryByTestId("help-policy-pack-delta-demo-sources")).toBeNull(); // TB-2092

    expect(screen.getByTestId("help-policy-pack-delta-demo-overview").textContent).toContain(
      "Approval",
    );
    expect(document.body.textContent ?? "").not.toContain("PRE_COMMIT_GOVERNANCE_GATE");
  });
});
