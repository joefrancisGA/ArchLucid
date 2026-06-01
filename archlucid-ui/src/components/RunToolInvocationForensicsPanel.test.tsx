import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunToolInvocationForensicsPanel } from "@/components/RunToolInvocationForensicsPanel";

describe("RunToolInvocationForensicsPanel", () => {
  it("renders nothing when there are no rows", () => {
    const { container } = render(
      <RunToolInvocationForensicsPanel
        hasTraceBlobPersistenceFailure={false}
        completenessDisclaimer="No rows."
        rows={[]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders invocation table and blob warning", () => {
    render(
      <RunToolInvocationForensicsPanel
        hasTraceBlobPersistenceFailure={true}
        completenessDisclaimer="Trace-derived rows only."
        rows={[
          {
            traceId: "t1",
            taskId: "task-1",
            agentType: "Topology",
            toolName: "topology-agent",
            argsPreview: "analyze topology",
            outcome: "Succeeded",
            durationMs: null,
            blobUploadFailed: false,
            invokedAtUtc: "2026-05-01T12:00:00Z",
          },
        ]}
      />,
    );

    expect(screen.getByText("Tool and external invocation forensics (diagnostics)")).toBeInTheDocument();
    expect(screen.getByText("topology-agent")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/blob upload failure/i);
  });
});
