import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPackDetailClient } from "@/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailClient";

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

describe("PolicyPackDetailClient", () => {
  it("shows load error with retry instead of not-found when listPolicyPacks fails", async () => {
    apiMocks.listPolicyPacks.mockRejectedValue(new Error("network"));
    apiMocks.listPolicyPackWorkspaceSelection.mockResolvedValue([]);

    render(<PolicyPackDetailClient policyPackId="missing-pack" />);

    expect(await screen.findByTestId("policy-pack-detail-load-error")).toBeInTheDocument();
    expect(screen.queryByTestId("policy-pack-detail-not-found")).not.toBeInTheDocument();
  });

  it("retries loading after load failure", async () => {
    apiMocks.listPolicyPacks.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce([]);
    apiMocks.listPolicyPackWorkspaceSelection.mockResolvedValue([]);

    render(<PolicyPackDetailClient policyPackId="missing-pack" />);

    expect(await screen.findByTestId("policy-pack-detail-load-error")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByTestId("policy-pack-detail-not-found")).toBeInTheDocument();
    });
    expect(apiMocks.listPolicyPacks).toHaveBeenCalledTimes(2);
  });

  it("includes pack id in not-found copy", async () => {
    apiMocks.listPolicyPacks.mockResolvedValue([]);
    apiMocks.listPolicyPackWorkspaceSelection.mockResolvedValue([]);

    render(<PolicyPackDetailClient policyPackId="missing-pack" />);

    expect(await screen.findByTestId("policy-pack-detail-not-found")).toBeInTheDocument();
    expect(screen.getByText(/No policy pack matches "missing-pack"/)).toBeInTheDocument();
  });
});
