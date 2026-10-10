import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InfraEvidenceDeclaredConnectionDetailPanel } from "./InfraEvidenceDeclaredConnectionDetailPanel";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "archlucid" }),
}));

const baseProps = {
  edge: { from: "api", to: "db", label: "reads", declaredConnectionId: null } as never,
  nodes: [],
  connections: [],
  connectionsLoading: false,
  connectionsError: null,
  onClose: vi.fn(),
};

describe("InfraEvidenceDeclaredConnectionDetailPanel", () => {
  it("reports an unpersisted approver and preserves the loaded-connection message", () => {
    const { rerender } = render(<InfraEvidenceDeclaredConnectionDetailPanel {...baseProps} />);

    expect(screen.getByText("Approver was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Rationale could not be resolved because the declared connection was not found.")).toBeInTheDocument();
    expect(screen.getByText("Expiration could not be resolved because the declared connection was not found.")).toBeInTheDocument();

    rerender(
      <InfraEvidenceDeclaredConnectionDetailPanel
        {...baseProps}
        edge={{ ...baseProps.edge, declaredConnectionId: "connection-1" }}
        connections={[
          {
            connectionId: "connection-1",
            rationale: null,
            evidenceReference: null,
            expirationUtc: null,
            status: null,
          },
        ] as never}
      />,
    );

    expect(screen.getByText("Approver was not included on the loaded connection")).toBeInTheDocument();
  });

  it("does not report omitted fields while the connection is loading or unavailable", () => {
    const { rerender } = render(
      <InfraEvidenceDeclaredConnectionDetailPanel
        {...baseProps}
        edge={{ ...baseProps.edge, declaredConnectionId: "connection-1" }}
        connectionsLoading
      />,
    );

    expect(screen.getByText("Loading rationale…")).toBeInTheDocument();
    expect(screen.getByText("Loading expiration…")).toBeInTheDocument();

    rerender(
      <InfraEvidenceDeclaredConnectionDetailPanel
        {...baseProps}
        edge={{ ...baseProps.edge, declaredConnectionId: "connection-1" }}
        connectionsError="Unable to load declared connections."
      />,
    );

    expect(screen.getByText("Rationale could not be loaded.")).toBeInTheDocument();
    expect(screen.getByText("Expiration could not be loaded.")).toBeInTheDocument();
  });

  it("distinguishes omitted expiration and rationale from stored empty strings", () => {
    const { rerender } = render(
      <InfraEvidenceDeclaredConnectionDetailPanel
        {...baseProps}
        edge={{ ...baseProps.edge, declaredConnectionId: "connection-1" }}
        connections={[{
          connectionId: "connection-1",
          rationale: null,
          evidenceReference: null,
          expirationUtc: null,
          status: null,
        }] as never}
      />,
    );

    expect(screen.getByText("Expiration was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Rationale was not stored.")).toBeInTheDocument();

    rerender(
      <InfraEvidenceDeclaredConnectionDetailPanel
        {...baseProps}
        edge={{ ...baseProps.edge, declaredConnectionId: "connection-1" }}
        connections={[{
          connectionId: "connection-1",
          rationale: "",
          evidenceReference: null,
          expirationUtc: "",
          status: null,
        }] as never}
      />,
    );

    expect(screen.getAllByText("Not recorded").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("Expiration was not stored.")).not.toBeInTheDocument();
    expect(screen.queryByText("Rationale was not stored.")).not.toBeInTheDocument();
  });
});
