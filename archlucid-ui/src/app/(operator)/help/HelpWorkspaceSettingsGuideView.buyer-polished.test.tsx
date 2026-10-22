import { render, screen } from "@testing-library/react";
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

import { HelpWorkspaceSettingsGuideView } from "@/app/(operator)/help/_sections/HelpWorkspaceSettingsGuideView";
import {
  WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE,
  WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE_BUYER,
  WORKSPACE_SETTINGS_HELP_PRIMARY_CONTENT_ID,
  WORKSPACE_SETTINGS_HELP_SKIP_LINK_LABEL,
} from "@/lib/workspace-settings-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWorkspaceSettingsGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("workspace-settings");

  it("renders skip link, buyer subtitle, orientation above overview, and hides registry provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected workspace-settings documentation entry.");
    }

    render(<HelpWorkspaceSettingsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: WORKSPACE_SETTINGS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${WORKSPACE_SETTINGS_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(WORKSPACE_SETTINGS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-workspace-settings-orientation-top")).toBeInTheDocument();
    expect(screen.queryByTestId("help-workspace-settings-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-workspace-settings-claim-discipline-strip")).toBeInTheDocument();

    const orientationTop = screen.getByTestId("help-workspace-settings-orientation-top");
    const overview = screen.getByTestId("help-workspace-settings-overview");

    expect(orientationTop.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
