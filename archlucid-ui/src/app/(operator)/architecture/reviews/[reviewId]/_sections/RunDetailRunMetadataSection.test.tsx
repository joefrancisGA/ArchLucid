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
    expect(screen.getByTestId("run-detail-retry-count-not-stored")).toHaveTextContent(
      "Retry count was not stored.",
    );
  });

  it("distinguishes missing metadata from stored empty values", () => {
    const { rerender } = render(
      <RunDetailRunMetadataSection
        run={{
          runId: "abc",
          projectId: "p1",
          createdUtc: "2026-01-01T00:00:00Z",
          description: null,
          retryCount: 0,
        }}
        runDetailTraceId={null}
      />,
    );

    expect(screen.getByText("Description was not stored.")).toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-retry-count-not-stored")).toBeNull();

    rerender(
      <RunDetailRunMetadataSection
        run={{
          runId: "abc",
          projectId: "p1",
          createdUtc: "2026-01-01T00:00:00Z",
          description: "",
          retryCount: 0,
        }}
        runDetailTraceId={null}
      />,
    );

    expect(screen.queryByText("Description was not stored.")).toBeNull();
    expect(screen.queryByTestId("run-detail-retry-count-not-stored")).toBeNull();
  });
});
