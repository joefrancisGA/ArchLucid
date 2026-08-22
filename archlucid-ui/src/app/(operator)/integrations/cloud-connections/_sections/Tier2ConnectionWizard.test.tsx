import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  }),
}));

vi.mock("@/hooks/use-tenant-trial-status-query", () => ({
  useTenantTrialStatusQuery: () => ({ data: null }),
}));

vi.mock("@/lib/api/cloud-connections-api", () => ({
  configureTier2Connection: vi.fn(),
  validateTier2ConnectionHostedRun: vi.fn(),
}));

import { configureTier2Connection, validateTier2ConnectionHostedRun } from "@/lib/api/cloud-connections-api";
import {
  AZURE_CLOUD_CONNECTION_BANNED_COPY,
  AZURE_CONNECTION_CLIENT_APP_ID_LABEL,
  AZURE_CONNECTION_IDS_STEP_LEAD,
} from "@/lib/azure-cloud-connection-copy";
import { CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE } from "@/lib/admin-integration-mutation-outcome-copy";
import { showError, showSuccess } from "@/lib/toast";

import { Tier2ConnectionWizard } from "./Tier2ConnectionWizard";

const VALID_GUID = "00000000-0000-0000-0000-000000000001";
const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const MANAGED_IDENTITY_ID = "22222222-2222-2222-2222-222222222222";

describe("Tier2ConnectionWizard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  it("renders security preflight instead of patronizing checkbox checklist", async () => {
    render(<Tier2ConnectionWizard onSaved={vi.fn()} />);

    expect(screen.getByTestId("cloud-security-preflight")).toBeInTheDocument();
    expect(screen.queryByText("Security review checklist")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Only Reader and Cost Management Reader/i)).not.toBeInTheDocument();
  });

  it("interpolates ArchLucid federation identifiers into the setup script (P0-3)", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", TENANT_ID);
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", MANAGED_IDENTITY_ID);

    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    expect(screen.getByTestId("tier2-federation-identifiers")).toHaveTextContent(TENANT_ID);
    expect(screen.getByRole("button", { name: "Help: ArchLucid tenant ID" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: ArchLucid managed identity object ID" })).toBeInTheDocument();
    expect(screen.getByTestId("tier2-federation-identifiers")).toHaveTextContent(MANAGED_IDENTITY_ID);
    expect(screen.getByText(/set SUBSCRIPTION_ID at the top of the script/i)).toBeInTheDocument();

    const scriptRegion = screen.getByRole("region", { name: "Azure CLI setup script" });
    expect(scriptRegion).toHaveTextContent(TENANT_ID);
    expect(scriptRegion).toHaveTextContent(MANAGED_IDENTITY_ID);
    expect(scriptRegion).not.toHaveTextContent("YOUR_ARCHLUCID_TENANT_ID");
    expect(scriptRegion).toHaveTextContent('SUBSCRIPTION_ID="YOUR_SUBSCRIPTION_ID"');
  });

  it("guides operators to Assurance status and Connection status when federation identifiers are unpublished", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_IDENTITY_TENANT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_HOSTED_MANAGED_IDENTITY_OBJECT_ID", "");

    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    expect(screen.getByTestId("tier2-federation-identifiers-sourcing")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Assurance status" })[0]).toHaveAttribute("href", "/assurance-status");
    expect(screen.getAllByRole("link", { name: "Connection status" })[0]).toHaveAttribute(
      "href",
      "/administration/connection-status",
    );
    expect(screen.getByTestId("tier2-federation-identifiers")).toHaveTextContent("Not published in this UI build");
    expect(screen.getByTestId("tier2-setup-script-unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Azure CLI setup script" })).toBeNull();
  });

  it("uses client/app ID in the helper, field label, and tooltip", () => {
    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText(AZURE_CONNECTION_IDS_STEP_LEAD)).toBeInTheDocument();
    expect(screen.getByLabelText(AZURE_CONNECTION_CLIENT_APP_ID_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Client/App ID" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Azure Tenant ID" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help: Subscription IDs" })).toBeInTheDocument();
  });

  it("shows workspace binding on the save step (P0-4)", async () => {
    window.localStorage.setItem(
      "archlucid_operator_scope_v1",
      JSON.stringify({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
        workspaceLabel: "Northwind Pilot",
        projectLabel: "Core",
      }),
    );

    render(<Tier2ConnectionWizard onSaved={vi.fn()} skipSecurityStep />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), { target: { value: VALID_GUID } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("tier2-summary-workspace")).toHaveTextContent("Northwind Pilot");
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
      expect(screen.getByText("Enter a valid Azure tenant ID GUID.")).toBeInTheDocument();
      expect(screen.getByText("Enter a valid client/app ID GUID.")).toBeInTheDocument();
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
      connectionId: "conn-1",
      tenantId: VALID_GUID,
      clientId: VALID_GUID,
      subscriptionIds: VALID_GUID,
      updatedUtc: "2026-08-12T12:00:00.000Z",
    });

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

  it("marks verifiable preflight topics verified after validation succeeds (P0-5)", async () => {
    vi.mocked(configureTier2Connection).mockResolvedValue({
      connectionId: "conn-1",
      tenantId: VALID_GUID,
      clientId: VALID_GUID,
      subscriptionIds: VALID_GUID,
      updatedUtc: "2026-08-12T12:00:00.000Z",
    });
    vi.mocked(validateTier2ConnectionHostedRun).mockResolvedValue({
      packageId: "pkg-1",
      resourceCount: 3,
    });

    render(<Tier2ConnectionWizard onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), { target: { value: VALID_GUID } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Save connection" }));

    await waitFor(() => {
      expect(screen.getByTestId("tier2-connection-save-success-callout")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("tier2-validate-hosted-run"));

    await waitFor(() => {
      expect(screen.getByTestId("cloud-security-preflight-verified-read-only-scope")).toHaveTextContent(/Verified/i);
    });
  });

  it("does not surface Tier/hosted-pull jargon on the Azure wizard surface (TB-1766)", async () => {
    vi.mocked(configureTier2Connection).mockResolvedValue({
      connectionId: "conn-1",
      tenantId: VALID_GUID,
      clientId: VALID_GUID,
      subscriptionIds: VALID_GUID,
      updatedUtc: "2026-08-12T12:00:00.000Z",
    });

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
