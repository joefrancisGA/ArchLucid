import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowSelfServicePageView } from "./SecureNowSelfServicePageView";

const mockUseSecureNowCollectionSetupInput = vi.fn(() => ({
  collectionInput: {
    hasConfiguredProvider: true,
    azureSubscriptionIdsPresent: false,
    hasSuccessfulPull: false,
  },
  isPending: false,
}));

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => mockUseSecureNowCollectionSetupInput(),
}));

describe("SecureNowSelfServicePageView", () => {
  it("renders the four checks and support mailto", () => {
    render(<SecureNowSelfServicePageView />);

    expect(screen.getByTestId("securenow-self-service-page")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-self-service-collection-setup")).toBeInTheDocument();
    for (const title of [
      "Collection missing or stale",
      "Connector will not finish",
      "No ranked path, or not verified",
      "Still stuck",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    for (const id of ["collection", "connector", "ranking", "email"]) {
      expect(document.getElementById(id)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Open Priorities & waves" })).toHaveAttribute(
      "href",
      "/security/remediation-factory",
    );
    expect(screen.getByRole("link", { name: "Open remediation tracker" })).toHaveAttribute(
      "href",
      "/security/remediation-instances",
    );
    expect(screen.getByRole("link", { name: "Email support" })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net?subject=SecureNow",
    );
  });

  it("links to cloud connections when collection setup is complete", () => {
    mockUseSecureNowCollectionSetupInput.mockReturnValueOnce({
      collectionInput: {
        hasConfiguredProvider: true,
        azureSubscriptionIdsPresent: true,
        hasSuccessfulPull: true,
      },
      isPending: false,
    });

    render(<SecureNowSelfServicePageView />);

    expect(screen.getByTestId("securenow-self-service-collection-ready-cloud-connections-link")).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );
  });
});
