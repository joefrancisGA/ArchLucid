import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorHomeSecureNowCollectionSetupSection } from "./OperatorHomeSecureNowCollectionSetupSection";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

const mockUseSecureNowCollectionSetupInput = vi.fn(() => ({
  collectionInput: {
    hasConfiguredProvider: true,
    azureSubscriptionIdsPresent: true,
    hasSuccessfulPull: false,
  },
  isPending: false,
}));

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => mockUseSecureNowCollectionSetupInput(),
}));

describe("OperatorHomeSecureNowCollectionSetupSection", () => {
  it("renders collection setup when incomplete", () => {
    render(<OperatorHomeSecureNowCollectionSetupSection />);

    expect(screen.getByTestId("operator-home-securenow-collection-setup")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-collection-setup")).toBeInTheDocument();
  });

  it("renders nothing when collection setup is complete", () => {
    mockUseSecureNowCollectionSetupInput.mockReturnValueOnce({
      collectionInput: {
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      },
      isPending: false,
    });

    render(<OperatorHomeSecureNowCollectionSetupSection />);

    expect(screen.queryByTestId("operator-home-securenow-collection-setup")).not.toBeInTheDocument();
  });
});
