import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => ({
    collectionInput: {
      hasConfiguredProvider: true,
      azureSubscriptionIdsPresent: true,
      hasSuccessfulPull: true,
    },
    isPending: false,
  }),
}));

import { OperatorHomeSecureNowCollectionSetupSection } from "@/components/operator-home/OperatorHomeSecureNowCollectionSetupSection";

describe("OperatorHomeSecureNowCollectionSetupSection", () => {
  it("renders collection setup and cloud connections link for SecureNow", () => {
    render(<OperatorHomeSecureNowCollectionSetupSection />);

    expect(screen.getByTestId("operator-home-securenow-collection-setup")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-collection-ready")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-cloud-connections-link")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
  });
});
