import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/security-declared-connection-api", () => ({
  listSecurityDeclaredConnections: vi.fn(async () => []),
  createSecurityDeclaredConnection: vi.fn(),
  revokeSecurityDeclaredConnection: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { listSecurityDeclaredConnections } from "@/lib/security-declared-connection-api";
import { DeclaredConnectionsWorkbenchClient } from "./DeclaredConnectionsWorkbenchClient";

describe("DeclaredConnectionsWorkbenchClient working mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    { expirationUtc: "2026-11-15T11:30:00Z", status: "Expired", label: "(expired)" },
    { expirationUtc: "2026-11-15T23:00:00", status: "Active", label: "(expires today)" },
  ] as const)("shows $label for expiry $expirationUtc", async ({ expirationUtc, status, label }) => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-11-15T12:00:00Z"));
    vi.mocked(listSecurityDeclaredConnections).mockResolvedValueOnce([{
      connectionId: "connection-1",
      fromCloudResourceId: "source",
      toCloudResourceId: "destination",
      relationshipType: "ConnectsTo",
      rationale: "The source connects to the destination.",
      evidenceReference: null,
      expirationUtc,
      status,
      createdUtc: "2026-11-01T12:00:00Z",
      updatedUtc: "2026-11-01T12:00:00Z",
    }]);

    render(<DeclaredConnectionsWorkbenchClient />);

    const row = await screen.findByTestId("infra-declared-connection-row-connection-1");
    expect(within(row).getByText(label)).toBeInTheDocument();
  });

  it("renders skip link, claim discipline, submit guard, and empty state", async () => {
    render(<DeclaredConnectionsWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-declared-connections-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("infra-declared-connections-save")).toBeDisabled();
    expect(screen.getByTestId("infra-declared-connections-submit-readiness")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("infra-declared-connections-empty-state")).toBeInTheDocument();
    });
  });
});
