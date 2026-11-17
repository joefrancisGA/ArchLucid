import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowSponsorRoiCollectionScopeHonestyLine } from "./SecureNowSponsorRoiCollectionScopeHonestyLine";

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

describe("SecureNowSponsorRoiCollectionScopeHonestyLine", () => {
  it("shows collection scope honesty when setup is incomplete", () => {
    render(<SecureNowSponsorRoiCollectionScopeHonestyLine />);

    expect(screen.getByTestId("securenow-sponsor-roi-collection-scope-honesty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cloud connections" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
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

    render(<SecureNowSponsorRoiCollectionScopeHonestyLine />);

    expect(screen.queryByTestId("securenow-sponsor-roi-collection-scope-honesty")).not.toBeInTheDocument();
  });
});
