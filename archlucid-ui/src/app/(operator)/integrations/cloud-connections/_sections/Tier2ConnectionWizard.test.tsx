import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  configureTier2Connection: vi.fn(),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

import { Tier2ConnectionWizard } from "./Tier2ConnectionWizard";

const VALID_GUID = "00000000-0000-0000-0000-000000000001";

describe("Tier2ConnectionWizard", () => {
  it("renders security preflight instead of patronizing checkbox checklist", async () => {
    render(<Tier2ConnectionWizard onSaved={vi.fn()} />);

    expect(screen.getByTestId("cloud-security-preflight")).toBeInTheDocument();
    expect(screen.queryByText("Security review checklist")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Only Reader and Cost Management Reader/i)).not.toBeInTheDocument();
  });

  it("names the script variables operators must set before running", () => {
    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    expect(
      screen.getByText(/set SUBSCRIPTION_ID, ARCHLUCID_TENANT_ID, and ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID/i),
    ).toBeInTheDocument();
    const scriptBlock = screen.getByText(/YOUR_ARCHLUCID_TENANT_ID/);
    expect(scriptBlock).toHaveTextContent("YOUR_ARCHLUCID_MANAGED_IDENTITY_OBJECT_ID");
    expect(scriptBlock).toHaveTextContent('SUBSCRIPTION_ID="YOUR_SUBSCRIPTION_ID"');
  });

  it("surfaces misconfigured tenant and client GUID validation on the connection step", async () => {
    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: "not-a-guid" } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: "also-invalid" } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), {
      target: { value: "still-not-a-guid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid Azure AD tenant GUID.")).toBeInTheDocument();
    });
  });

  it("advances to save step when connection identifiers are valid", async () => {
    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), { target: { value: VALID_GUID } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Save and validate")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save connection" })).toBeInTheDocument();
  });
});
