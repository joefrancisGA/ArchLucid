import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const { fetchRankedPaths } = vi.hoisted(() => ({ fetchRankedPaths: vi.fn() }));

vi.mock("@/lib/security-evidence-path-api", () => ({
  fetchRankedSecurityEvidencePaths: fetchRankedPaths,
}));

function renderNextStep() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <SecureNowDriftPostCaptureNextStep selectedSnapshotId="snap-1" />
    </QueryClientProvider>,
  );
  return queryClient;
}

describe("SecureNowDriftPostCaptureNextStep", () => {
  beforeEach(() => {
    fetchRankedPaths.mockReset();
    fetchRankedPaths.mockResolvedValue({ items: [{ pathId: "fixture-path-01" }] });
  });

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("links path inspect when collection is complete and a snapshot is selected", async () => {
    renderNextStep();

    expect(screen.getByTestId("securenow-drift-post-capture-next-step")).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Open Path inspect for the top ranked path" })).toHaveAttribute(
      "href",
      "/security/remediation-factory?pathId=fixture-path-01",
    );
  });

  it("keeps the generic Path inspect link while the first ranked-path request is paused", () => {
    onlineManager.setOnline(false);
    const queryClient = renderNextStep();

    expect(queryClient.getQueryCache().getAll()[0]?.state.fetchStatus).toBe("paused");
    expect(fetchRankedPaths).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Open Path inspect" })).toHaveAttribute(
      "href",
      "/security/remediation-factory",
    );
    expect(screen.queryByText("Loading next step…")).not.toBeInTheDocument();
  });
});
