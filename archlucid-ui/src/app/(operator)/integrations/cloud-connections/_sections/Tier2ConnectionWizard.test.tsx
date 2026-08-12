import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 100,
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 100,
      hasCommittedArchitectureReview: false,
    },
    callerAuthorityRank: 100,
    isAuthorityLoading: false,
  }),}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  configureTier2Connection: vi.fn(),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

import { configureTier2Connection } from "@/lib/api/cloud-connections-api";
import { AZURE_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/azure-cloud-connection-copy";
import { CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { showError, showSuccess } from "@/lib/toast";

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

  it("shows durable in-page success after save without toast", async () => {
    vi.mocked(configureTier2Connection).mockResolvedValue({
      id: "conn-1",
      tenantId: VALID_GUID,
      clientId: VALID_GUID,
      subscriptionIds: [VALID_GUID],
    } as never);

    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), { target: { value: VALID_GUID } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Save connection" }));

    await waitFor(() => {
      expect(screen.getByTestId("tier2-connection-save-success-callout")).toHaveTextContent(
        CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,
      );
    });

    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
  });

  it("does not surface Tier/hosted-pull jargon on the Azure wizard surface (TB-1766)", async () => {
    vi.mocked(configureTier2Connection).mockResolvedValue({
      id: "conn-1",
      tenantId: VALID_GUID,
      clientId: VALID_GUID,
      subscriptionIds: [VALID_GUID],
    } as never);

    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), { target: { value: VALID_GUID } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Save connection" }));

    await waitFor(() => {
      expect(screen.getByTestId("tier2-connection-save-success-callout")).toBeInTheDocument();
    });

    const wizard = screen.getByTestId("tier2-connection-wizard");
    const text = wizard.textContent ?? "";

    for (const banned of AZURE_CLOUD_CONNECTION_BANNED_COPY) {
      expect(text.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });
});
