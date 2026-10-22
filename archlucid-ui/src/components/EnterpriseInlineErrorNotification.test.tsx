import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EnterpriseInlineErrorNotification } from "@/components/EnterpriseInlineErrorNotification";

vi.mock("@/lib/report-problem-surfaces", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/report-problem-surfaces")>();
  return {
    ...actual,
    isReportProblemEnabledForSurface: () => true,
  };
});

describe("EnterpriseInlineErrorNotification", () => {
  it("renders role=alert with heading distinct from empty-state status", () => {
    render(
      <EnterpriseInlineErrorNotification
        testId="governance-findings-load-failed"
        title="Could not load your assigned findings"
        description="Retry the load or check connectivity."
        reportProblem={{
          surfaceId: "governance-findings-queue-hard-failure",
          errorTitle: "Assigned to me",
          errorCode: "governance-findings-load-failed",
        }}
      />,
    );

    const alert = screen.getByTestId("governance-findings-load-failed");
    expect(alert).toHaveAttribute("role", "alert");
    expect(screen.getByRole("heading", { name: "Could not load your assigned findings" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("surfaces copyable diagnostics behind disclosure and threads correlation into Report problem", () => {
    render(
      <EnterpriseInlineErrorNotification
        testId="governance-findings-load-failed"
        title="Could not load your assigned findings"
        description="Retry the load or check connectivity."
        diagnostics={{
          attemptedAtUtc: "2026-08-13T12:00:00.000Z",
          correlationId: "corr-assigned-1",
          errorCode: "DATABASE_UNAVAILABLE",
          httpStatus: 503,
        }}
        reportProblem={{
          surfaceId: "governance-findings-queue-hard-failure",
          errorTitle: "Assigned to me",
          errorCode: "DATABASE_UNAVAILABLE",
          correlationId: "corr-assigned-1",
          httpStatus: 503,
        }}
      />,
    );

    expect(screen.getByTestId("enterprise-inline-error-diagnostics")).toBeInTheDocument();
    expect(screen.getByText("2026-08-13T12:00:00.000Z")).toBeInTheDocument();
    expect(screen.getByText("corr-assigned-1")).toBeInTheDocument();
    expect(screen.getByText("DATABASE_UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByText("503")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });
});
