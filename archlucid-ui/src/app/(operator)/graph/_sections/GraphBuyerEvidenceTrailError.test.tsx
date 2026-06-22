import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GraphBuyerEvidenceTrailError } from "@/app/(operator)/graph/_sections/GraphBuyerEvidenceTrailError";

describe("GraphBuyerEvidenceTrailError", () => {
  it("hides raw HTTP and request details until Technical details is expanded", () => {
    render(
      <GraphBuyerEvidenceTrailError
        failure={{
          message: "Request failed (404 Not Found)",
          httpStatus: 404,
          correlationId: "req-abc-123",
        }}
        runId="demo-run"
        loading={false}
        onRetry={() => undefined}
        graphEndpointHint="/v1/provenance/runs/demo-run/graph"
      />,
    );

    expect(screen.getByText("Workspace data unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open troubleshooting" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "System health" })).toBeInTheDocument();
    expect(screen.queryByText(/Request failed/i)).toBeNull();

    const detailsEl = screen.getByText("Technical details").closest("details");

    expect(detailsEl).not.toBeNull();
    expect(detailsEl).not.toHaveAttribute("open");
    expect(detailsEl?.textContent ?? "").toContain("404");
    expect(detailsEl?.textContent ?? "").toContain("req-abc-123");
  });
});
