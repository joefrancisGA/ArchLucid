import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  SECURENOW_CLOUD_CONNECTIONS_HELP_START_HERE_CARD_TITLE,
  cloudConnectionsHelpPageSubtitle,
} from "@/lib/cloud-connections-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpCloudConnectionsGuideView SecureNow shell", () => {
  const loaded = tryLoadProductDocumentation("cloud-connections");

  it("orients operators with Azure-only tiers and extract-upload CTA", () => {
    if (loaded === null) {
      throw new Error("Expected cloud-connections documentation to load.");
    }

    render(<HelpCloudConnectionsGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByText(cloudConnectionsHelpPageSubtitle("security"))).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_CLOUD_CONNECTIONS_HELP_START_HERE_CARD_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-header-primary-cta")).toHaveTextContent("Extract and upload");
    expect(screen.getByTestId("help-cloud-connections-start-here-primary-cta")).toHaveAttribute(
      "href",
      "/infrastructure/manual-upload",
    );

    const providerScope = screen.getByTestId("help-cloud-connections-provider-scope");
    expect(within(providerScope).queryByRole("link", { name: "Connect AWS securely" })).toBeNull();
    expect(within(providerScope).getAllByRole("row")).toHaveLength(2);
  });
});
