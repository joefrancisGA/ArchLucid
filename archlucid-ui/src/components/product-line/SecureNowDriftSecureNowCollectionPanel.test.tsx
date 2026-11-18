import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SecureNowDriftSecureNowCollectionPanel } from "./SecureNowDriftSecureNowCollectionPanel";

const productLineContext = vi.hoisted(() => ({ productLine: "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => productLineContext,
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
  afterEach(() => {
    productLineContext.productLine = "security";
    mockSetup.mockReset();
  });

  it("disables the setup query on the ArchLucid Drift page", () => {
    productLineContext.productLine = "architecture";
    mockSetup.mockReturnValue({ collectionInput: null, isPending: true, isError: false });

    const { container } = render(<SecureNowDriftSecureNowCollectionPanel selectedSnapshotId="snap-1" />);

    expect(mockSetup).toHaveBeenCalledWith({ snapshotCaptureSucceeded: null, enabled: false });
    expect(container).toBeEmptyDOMElement();
  });

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

    expect(mockSetup).toHaveBeenCalledWith({ snapshotCaptureSucceeded: null, enabled: true });
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
