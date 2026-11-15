import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPackDetailClient } from "@/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailClient";
import { BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID } from "@/lib/policy/policy-pack-detail-resolver";

const apiMocks = vi.hoisted(() => ({
  listPolicyPacks: vi.fn(),
  listPolicyPackWorkspaceSelection: vi.fn(),
  getPolicyPackVersion: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  listPolicyPacks: apiMocks.listPolicyPacks,
  listPolicyPackWorkspaceSelection: apiMocks.listPolicyPackWorkspaceSelection,
  getPolicyPackVersion: apiMocks.getPolicyPackVersion,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
}));

describe("PolicyPackDetailClient", () => {
  it("shows load error with retry instead of not-found when listPolicyPacks fails", async () => {
    apiMocks.listPolicyPacks.mockRejectedValue(new Error("network"));
    apiMocks.listPolicyPackWorkspaceSelection.mockResolvedValue([]);

    render(<PolicyPackDetailClient policyPackId="missing-pack" />);

    expect(await screen.findByTestId("policy-pack-detail-load-error")).toBeInTheDocument();
    expect(screen.queryByTestId("policy-pack-detail-not-found")).not.toBeInTheDocument();
  });

  it("retries loading after load failure", async () => {
    let listPolicyPacksCalls = 0;
    apiMocks.listPolicyPacks.mockImplementation(async () => {
      listPolicyPacksCalls += 1;
      if (listPolicyPacksCalls === 1) {
        throw new Error("network");
      }

      return [];
    });
    apiMocks.listPolicyPackWorkspaceSelection.mockResolvedValue([]);

    render(<PolicyPackDetailClient policyPackId="missing-pack" />);

    expect(await screen.findByTestId("policy-pack-detail-load-error")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByTestId("policy-pack-detail-not-found")).toBeInTheDocument();
    });
    expect(listPolicyPacksCalls).toBeGreaterThanOrEqual(2);
  });

  it("includes pack id in not-found copy", async () => {
    apiMocks.listPolicyPacks.mockResolvedValue([]);
    apiMocks.listPolicyPackWorkspaceSelection.mockResolvedValue([]);

    render(<PolicyPackDetailClient policyPackId="missing-pack" />);

    expect(await screen.findByTestId("policy-pack-detail-not-found")).toBeInTheDocument();
    expect(screen.getByText(/No policy pack matches "missing-pack"/)).toBeInTheDocument();
  });

  it("offers a retry when the bundled pack's workspace enablement cannot be loaded", async () => {
    const policyPackId = BUNDLED_RESPONSIBLE_AI_POLICY_PACK_ID;
    apiMocks.listPolicyPacks.mockResolvedValue([]);
    apiMocks.listPolicyPackWorkspaceSelection
      .mockRejectedValueOnce(new Error("workspace selection unavailable"))
      .mockResolvedValue([{ policyPackId, isEnabled: true, isGloballyActive: false }]);

    render(<PolicyPackDetailClient policyPackId={policyPackId} />);

    expect(await screen.findByTestId("policy-pack-detail-load-error")).toBeInTheDocument();
    expect(screen.queryByText("Not enabled")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Enabled")).toBeInTheDocument();
    expect(screen.queryByTestId("policy-pack-detail-load-error")).not.toBeInTheDocument();
  });
});
