import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AskContinueLastThreadRow } from "./AskContinueLastThreadRow";

describe("AskContinueLastThreadRow", () => {
  it("resumes the selected thread", () => {
    const onResume = vi.fn();

    render(
      <AskContinueLastThreadRow
        thread={{
          threadId: "thread-1",
          tenantId: "tenant-1",
          workspaceId: "workspace-1",
          projectId: "project-1",
          runId: "run-1",
          title: "Claims review Q&A",
          lastUpdatedUtc: "2026-01-01T00:00:00Z",
          createdUtc: "2026-01-01T00:00:00Z",
        }}
        onResume={onResume}
      />,
    );

    fireEvent.click(screen.getByTestId("ask-continue-last-thread-open"));
    expect(onResume).toHaveBeenCalledWith("thread-1");
  });
});
