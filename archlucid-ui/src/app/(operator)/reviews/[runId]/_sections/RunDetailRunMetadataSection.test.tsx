import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailRunMetadataSection } from "./RunDetailRunMetadataSection";

describe("RunDetailRunMetadataSection", () => {
  it("shows retry count when run was re-attempted", () => {
    render(
      <RunDetailRunMetadataSection
        run={{
          runId: "abc",
          projectId: "p1",
          createdUtc: "2026-01-01T00:00:00Z",
          retryCount: 2,
        }}
        runDetailTraceId={null}
      />,
    );

    expect(screen.getByTestId("run-detail-retry-count")).toHaveTextContent("Retry count:");
    expect(screen.getByTestId("run-detail-retry-count")).toHaveTextContent("2");
  });

  it("hides retry count when zero or absent", () => {
    render(
      <RunDetailRunMetadataSection
        run={{
          runId: "abc",
          projectId: "p1",
          createdUtc: "2026-01-01T00:00:00Z",
        }}
        runDetailTraceId={null}
      />,
    );

    expect(screen.queryByTestId("run-detail-retry-count")).toBeNull();
  });
});
