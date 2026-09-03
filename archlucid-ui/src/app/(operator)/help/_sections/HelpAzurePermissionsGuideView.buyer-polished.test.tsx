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

vi.mock("@/app/(operator)/help/_sections/HelpAzurePermissionsVerificationPanel", () => ({
  HelpAzurePermissionsVerificationPanel: (props: { readonly returnHref: string }) => (
    <div data-testid="azure-permissions-verify-section" data-return-href={props.returnHref} />
  ),
}));

vi.mock("@/app/(operator)/help/_sections/HelpAzurePermissionsConnectionContext", () => ({
  HelpAzurePermissionsConnectionContext: () => <div data-testid="azure-permissions-connection-context" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpAzurePermissionsGuideView } from "@/app/(operator)/help/_sections/HelpAzurePermissionsGuideView";
import {
  AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE,
  AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID,
  AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE,
  AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION,
  AZURE_PERMISSIONS_HELP_SOURCES,
} from "@/lib/azure-permissions-help-evidence-copy";
import {
  AZURE_PERMISSIONS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AZURE_PERMISSIONS_HELP_SKIP_LINK_LABEL,
  AZURE_PERMISSIONS_HELP_SKIP_TARGET_ID,
} from "@/lib/azure-permissions-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpAzurePermissionsGuideView buyer-polished shell (HE)", () => {
  const entry = getProductDocumentationEntry("azure-permissions");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (entry === undefined) {
      throw new Error("Expected azure-permissions documentation entry.");
    }

    render(<HelpAzurePermissionsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: AZURE_PERMISSIONS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${AZURE_PERMISSIONS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(AZURE_PERMISSIONS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("azure-permissions-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-azure-permissions-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AZURE_PERMISSIONS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-help-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-azure-permissions-primary-content");
    const firstViewport = screen.getByTestId(AZURE_PERMISSIONS_HELP_FIRST_VIEWPORT_TEST_ID);
    const trustPanel = screen.getByTestId("azure-permissions-trust-panel");
    const orientationBottom = screen.getByTestId("help-azure-permissions-orientation-bottom");
    const sourcesSection = screen.getByTestId("azure-permissions-help-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(trustPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.testId)).toHaveAttribute(
      "href",
      AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.defaultHref,
    );

    const visibleSources = filterWhereToGoNextFollowUpLinks(AZURE_PERMISSIONS_HELP_SOURCES);

    for (const source of visibleSources) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
