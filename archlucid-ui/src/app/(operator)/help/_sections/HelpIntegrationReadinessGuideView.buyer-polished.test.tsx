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

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/integration-readiness",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HelpIntegrationReadinessGuideView } from "@/app/(operator)/help/_sections/HelpIntegrationReadinessGuideView";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";
import { INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID } from "@/lib/integration-readiness-help-guide-content";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpIntegrationReadinessGuideView buyer-polished shell (HEI)", () => {
  const loaded = tryLoadProductDocumentation("integration-readiness");

  it("renders claim discipline strip, workspace CTA, and evidence orientation sources", () => {
    if (loaded === null) {
      throw new Error("Expected integration-readiness documentation to load.");
    }

    render(<HelpIntegrationReadinessGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-integration-readiness-claim-discipline-strip")).toHaveTextContent(
      INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId(INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID)).toBeInTheDocument();
    expect(
      within(screen.getByTestId("help-integration-readiness-action-panel")).getByRole("link", {
        name: INTEGRATION_READINESS_HELP_PRIMARY_ACTION.label,
      }),
    ).toHaveAttribute("href", INTEGRATION_READINESS_HELP_PRIMARY_ACTION.href);
    expect(screen.getByRole("heading", { level: 2, name: INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("integration-readiness-help-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(INTEGRATION_READINESS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
