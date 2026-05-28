import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunToolInvocationForensicsPanel } from "@/components/RunToolInvocationForensicsPanel";

describe("RunToolInvocationForensicsPanel", () => {
  it("renders explicit not-recorded state", () => {
    render(<RunToolInvocationForensicsPanel hasTraceBlobPersistenceFailure={false} />);

    expect(screen.getByText("Tool and external invocation forensics (diagnostics)")).toBeInTheDocument();
    expect(screen.getByText(/Structured tool-call and external-invocation rows are not recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/no safe structured invocation ledger exists yet/i)).toBeInTheDocument();
  });

  it("renders trace completeness warning when blob persistence failed", () => {
    render(<RunToolInvocationForensicsPanel hasTraceBlobPersistenceFailure={true} />);

    expect(screen.getByRole("status")).toHaveTextContent(/Full trace completeness is degraded/i);
  });
});
