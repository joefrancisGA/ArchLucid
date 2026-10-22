import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GovernanceEnvironmentsClient from "@/components/governance/GovernanceEnvironmentsClient";

const replaceGovernanceEnvironmentCatalogMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/policy-governance-api", () => ({
  replaceGovernanceEnvironmentCatalog: (...args: unknown[]) => replaceGovernanceEnvironmentCatalogMock(...args),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/hooks/use-governance-environment-catalog-query", () => ({
  governanceEnvironmentCatalogQueryKey: ["governance-environment-catalog"],
  useGovernanceEnvironmentCatalogQuery: () => ({
    data: {
      isAdministratorConfigured: true,
      environments: [
        {
          slug: "staging",
          displayName: "Staging",
          sortOrder: 1,
          isActive: true,
        },
        {
          slug: "production",
          displayName: "Production",
          sortOrder: 2,
          isActive: true,
        },
      ],
      transitions: [{ sourceSlug: "staging", targetSlug: "production" }],
    },
    isError: false,
    refetch: vi.fn(),
  }),
}));

const showSuccess = vi.fn();

vi.mock("@/lib/toast", () => ({
  showSuccess: (...args: unknown[]) => showSuccess(...args),
}));

describe("GovernanceEnvironmentsClient", () => {
  beforeEach(() => {
    showSuccess.mockClear();
    replaceGovernanceEnvironmentCatalogMock.mockReset();
    replaceGovernanceEnvironmentCatalogMock.mockRejectedValue(new Error("Catalog save blocked."));
  });

  it("shows an inline error instead of a toast when save fails", async () => {
    render(<GovernanceEnvironmentsClient />);

    fireEvent.click(await screen.findByRole("button", { name: "Save approval environments" }));

    await waitFor(() => {
      expect(screen.getByTestId("governance-environments-save-error")).toHaveTextContent(
        "Could not save approval environments",
      );
    });
    expect(screen.getByTestId("governance-environments-save-error")).toHaveTextContent("Catalog save blocked.");
  });
});
