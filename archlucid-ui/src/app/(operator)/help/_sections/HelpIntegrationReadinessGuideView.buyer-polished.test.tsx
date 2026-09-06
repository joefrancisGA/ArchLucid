import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/integration-readiness",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpIntegrationReadinessGuideView } from "@/app/(operator)/help/_sections/HelpIntegrationReadinessGuideView";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID,
} from "@/lib/integration-readiness-help-guide-content";
import {
  INTEGRATION_READINESS_HELP_PRIMARY_CONTENT_ID,
  INTEGRATION_READINESS_HELP_SKIP_LINK_LABEL,
  INTEGRATION_READINESS_HELP_SKIP_TARGET_ID,
} from "@/lib/integration-readiness-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpIntegrationReadinessGuideView buyer-polished shell (HEI)", () => {
  const loaded = tryLoadProductDocumentation("integration-readiness");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected integration-readiness documentation to load.");
    }

    render(<HelpIntegrationReadinessGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: INTEGRATION_READINESS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${INTEGRATION_READINESS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-integration-readiness-header-claim-discipline")).toHaveTextContent(
      INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-integration-readiness-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("integration-readiness-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-export-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-integration-readiness-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(INTEGRATION_READINESS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-integration-readiness-action-panel");
    const orientationBottom = screen.getByTestId("help-integration-readiness-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-integration-readiness-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(
      within(actionPanel).getByRole("link", { name: INTEGRATION_READINESS_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", INTEGRATION_READINESS_HELP_PRIMARY_ACTION.href);

    for (const source of filterWhereToGoNextFollowUpLinks(INTEGRATION_READINESS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
