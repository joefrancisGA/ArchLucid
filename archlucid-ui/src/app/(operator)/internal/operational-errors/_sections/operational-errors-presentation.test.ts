import { describe, expect, it } from "vitest";

import {
  buildOperationalErrorsTableClipboardText,
  rowMatchesOperationalErrorFilters,
  truncateOperationalErrorMessage,
  type OperationalErrorRow,
} from "@/app/(operator)/internal/operational-errors/_sections/operational-errors-presentation";

const sampleRow: OperationalErrorRow = {
  id: "00000000-0000-0000-0000-000000000001",
  occurredUtc: "2026-08-28T00:00:00Z",
  source: "Api",
  category: "HttpError",
  httpStatusCode: 404,
  httpMethod: "GET",
  requestPath: "/v1/runs/missing",
  problemType: "NotFound",
  exceptionType: null,
  message: "Run not found",
  stackTrace: null,
  sqlErrorNumber: null,
  sqlErrorState: null,
  correlationId: "corr-123",
  otelTraceId: null,
  tenantId: "tenant-abc",
  workspaceId: null,
  projectId: null,
  actorUserId: null,
  detailJson: "{}",
};

describe("operational-errors-presentation", () => {
  it("truncates long messages", () => {
    expect(truncateOperationalErrorMessage("x".repeat(200), 20)).toHaveLength(20);
  });

  it("filters by category and correlation", () => {
    expect(
      rowMatchesOperationalErrorFilters(sampleRow, "HttpError", "all", "", "corr-123"),
    ).toBe(true);

    expect(
      rowMatchesOperationalErrorFilters(sampleRow, "DatabaseError", "all", "", ""),
    ).toBe(false);
  });

  it("builds clipboard text with full row values and csv escaping", () => {
    const rowWithQuotes: OperationalErrorRow = {
      ...sampleRow,
      message: 'Must declare the scalar variable "@tenantId".',
      correlationId: "corr-123",
      tenantId: "tenant-abc",
    };

    const clipboardText = buildOperationalErrorsTableClipboardText([rowWithQuotes, sampleRow]);

    expect(clipboardText.startsWith("Occurred (UTC),Category,Status,Path,Message,Correlation,Tenant")).toBe(true);
    expect(clipboardText).toContain('"Must declare the scalar variable ""@tenantId""."');
    expect(clipboardText).toContain("corr-123");
    expect(clipboardText).toContain("tenant-abc");
    expect(clipboardText.split("\n")).toHaveLength(3);
  });
});
