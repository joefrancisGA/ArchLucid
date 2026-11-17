import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecureNowDriftPostCaptureNextStep } from "./SecureNowDriftPostCaptureNextStep";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" as const }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ tenantId: "t", workspaceId: "w", projectId: "p" }),
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

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");

  return {
    ...actual,
    useQuery: () => ({
      isPending: false,
      data: { items: [{ pathId: "fixture-path-01" }] },
    }),
  };
});

describe("SecureNowDriftPostCaptureNextStep", () => {
  it("links path inspect when collection is complete and a snapshot is selected", () => {
    render(<SecureNowDriftPostCaptureNextStep selectedSnapshotId="snap-1" />);

    expect(screen.getByTestId("securenow-drift-post-capture-next-step")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-drift-post-capture-next-link")).toHaveAttribute(
      "href",
      "/security/remediation-factory?pathId=fixture-path-01",
    );
  });
});
