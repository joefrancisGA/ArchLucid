import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const listTier2Connections = vi.fn(async () => []);
const configureTier2Connection = vi.fn();
const validateTier2ConnectionHostedRun = vi.fn();

vi.mock("@/lib/api/cloud-connections-api", () => ({
  listTier2Connections: (...args: unknown[]) => listTier2Connections(...args),
  configureTier2Connection: (...args: unknown[]) => configureTier2Connection(...args),
  validateTier2ConnectionHostedRun: (...args: unknown[]) => validateTier2ConnectionHostedRun(...args),
}));

import { CloudConnectionsPageClient } from "./CloudConnectionsPageClient";

const VALID_GUID = "00000000-0000-0000-0000-000000000001";

function checkAllRbacItems(): void {
  for (const checkbox of screen.getAllByRole("checkbox")) {
    fireEvent.click(checkbox);
  }
}

function advanceToConnectionIdsStep(): void {
  checkAllRbacItems();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
}

describe("CloudConnectionsPageClient", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Tier 2 wizard with security review step", async () => {
    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("tier2-connection-wizard")).toBeInTheDocument();
    });

    expect(screen.getByText("Security review checklist")).toBeInTheDocument();
    expect(screen.getByLabelText(/Only Reader and Cost Management Reader/i)).toBeInTheDocument();
  });

  it("surfaces misconfigured tenant and client GUID validation on the connection step", async () => {
    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("tier2-connection-wizard")).toBeInTheDocument();
    });

    advanceToConnectionIdsStep();

    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: "not-a-guid" } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: "also-invalid" } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), {
      target: { value: "still-not-a-guid" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid Azure AD tenant GUID.")).toBeInTheDocument();
    });

    expect(screen.getByText("Enter a valid application (client) ID GUID.")).toBeInTheDocument();
    expect(screen.getByText("Subscription ID 'still-not-a-guid' must be a GUID.")).toBeInTheDocument();
  });

  it("advances to save step when connection identifiers are valid", async () => {
    render(<CloudConnectionsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("tier2-connection-wizard")).toBeInTheDocument();
    });

    advanceToConnectionIdsStep();

    fireEvent.change(screen.getByTestId("tier2-tenant-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-client-id"), { target: { value: VALID_GUID } });
    fireEvent.change(screen.getByTestId("tier2-subscription-ids"), { target: { value: VALID_GUID } });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Save and validate")).toBeInTheDocument();
    expect(screen.getByTestId("tier2-summary-tenant")).toHaveTextContent(VALID_GUID);
    expect(screen.getByRole("button", { name: "Save connection" })).toBeInTheDocument();
  });
});
