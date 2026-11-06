import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowRemediationFactoryCollectionSetupBanner } from "./SecureNowRemediationFactoryCollectionSetupBanner";

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

describe("SecureNowRemediationFactoryCollectionSetupBanner", () => {
  it("shows progress and cloud connections link when collection is incomplete", () => {
    render(<SecureNowRemediationFactoryCollectionSetupBanner />);

    expect(screen.getByTestId("remediation-factory-collection-setup-banner")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-collection-setup-cloud-connections-link")).toHaveAttribute(
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

    render(<SecureNowRemediationFactoryCollectionSetupBanner />);

    expect(screen.queryByTestId("remediation-factory-collection-setup-banner")).not.toBeInTheDocument();
  });
});
