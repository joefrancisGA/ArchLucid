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
});
