import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowDriftSecureNowCollectionPanel } from "./SecureNowDriftSecureNowCollectionPanel";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: vi.fn(),
}));

vi.mock("@/components/product-line/SecureNowCollectionSetupStatusSection", () => ({
  SecureNowCollectionSetupStatusSection: () => <div data-testid="drift-collection-setup-stub" />,
}));

vi.mock("@/components/product-line/SecureNowDriftPostCaptureNextStep", () => ({
  SecureNowDriftPostCaptureNextStep: () => <div data-testid="drift-post-capture-stub" />,
}));

import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";

const mockSetup = vi.mocked(useSecureNowCollectionSetupInput);

describe("SecureNowDriftSecureNowCollectionPanel", () => {
  it("shows collection setup when incomplete", () => {
    mockSetup.mockReturnValue({
      collectionInput: {
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: false,
      },
      isPending: false,
      isError: false,
    });

    render(<SecureNowDriftSecureNowCollectionPanel selectedSnapshotId="snap-1" />);

    expect(screen.getByTestId("drift-collection-setup-stub")).toBeInTheDocument();
  });

  it("shows post-capture next step when collection is complete", () => {
    mockSetup.mockReturnValue({
      collectionInput: {
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      },
      isPending: false,
      isError: false,
    });

    render(<SecureNowDriftSecureNowCollectionPanel selectedSnapshotId="snap-1" />);

    expect(screen.getByTestId("drift-post-capture-stub")).toBeInTheDocument();
  });
});
