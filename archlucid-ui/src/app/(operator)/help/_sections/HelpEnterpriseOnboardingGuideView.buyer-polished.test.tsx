import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="mermaid-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-pdf" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/enterprise-onboarding",
}));

import { HelpEnterpriseOnboardingGuideView } from "@/app/(operator)/help/_sections/HelpEnterpriseOnboardingGuideView";
import {
  ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE,
  ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE,
  ENTERPRISE_ONBOARDING_HELP_SOURCES,
} from "@/lib/enterprise-onboarding-help-evidence-copy";
import {
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION,
  ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS,
} from "@/lib/enterprise-onboarding-help-copy";
import {
  ENTERPRISE_ONBOARDING_HELP_FIRST_VIEWPORT_TEST_ID,
  ENTERPRISE_ONBOARDING_HELP_SKIP_LINK_LABEL,
  ENTERPRISE_ONBOARDING_HELP_SKIP_TARGET_ID,
} from "@/lib/enterprise-onboarding-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpEnterpriseOnboardingGuideView buyer-polished shell (HEX)", () => {
  const loaded = tryLoadProductDocumentation("enterprise-onboarding");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected enterprise onboarding documentation to load.");
    }

    render(<HelpEnterpriseOnboardingGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: ENTERPRISE_ONBOARDING_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ENTERPRISE_ONBOARDING_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-enterprise-onboarding-header-claim-discipline")).toHaveTextContent(
      ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-enterprise-onboarding-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("enterprise-onboarding-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-pdf")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("enterprise-onboarding-help-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-enterprise-onboarding-primary-content");
    const firstViewport = screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-enterprise-onboarding-action-panel");
    const orientationBottom = screen.getByTestId("help-enterprise-onboarding-orientation-bottom");
    const sourcesSection = screen.getByTestId("enterprise-onboarding-help-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    const headerActions = screen.getByTestId("help-enterprise-onboarding-header-actions");

    expect(
      within(headerActions).getByRole("link", { name: ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.configureSso.label }),
    ).toHaveAttribute("href", ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.configureSso.href);
    expect(
      within(actionPanel).getByRole("link", { name: ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openCorePilot.label }),
    ).toHaveAttribute("href", ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openCorePilot.href);
    expect(screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTIONS.openOnboardingHub.testId)).toHaveAttribute(
      "href",
      "#onboarding-hub",
    );

    for (const source of filterWhereToGoNextFollowUpLinks(ENTERPRISE_ONBOARDING_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(screen.getByTestId(ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      ENTERPRISE_ONBOARDING_HELP_PRIMARY_ACTION.href,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Start tenant onboarding" })).toBeInTheDocument();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
