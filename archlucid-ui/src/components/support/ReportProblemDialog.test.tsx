import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  formatReportProblemProductVersionDisplay,
  ReportProblemDialog,
  resolveReportProblemReferenceId,
} from "@/components/support/ReportProblemDialog";
import type { ReportProblemContext } from "@/lib/report-problem-context";
import {
  REPORT_PROBLEM_SUBMIT_LABEL,
  formatReportProblemAcknowledgement,
} from "@/lib/report-problem-copy";

expect.extend(toHaveNoViolations);

const showError = vi.fn();

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
}));

const sampleContext: ReportProblemContext = {
  reviewId: "run-42",
  tenantId: "tenant-1",
  workspaceId: "workspace-9",
  productVersion: "ArchLucid.Api 1.0.0",
  uiVersion: "abc1234@2026-07-16",
  apiCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
  uiCommitSha: "abcdef1234567890abcdef1234567890abcdef12",
  deployStamp: "1842212345-1",
  environment: "Staging",
  browserClient: "vitest",
  correlationId: "corr-001",
  clientRequestId: null,
  routePath: "/architecture/reviews/run-42",
  errorCode: "503",
  errorTitle: "Service unavailable",
  httpStatus: 503,
  submittedAtUtc: "2026-07-16T12:00:00.000Z",
};

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

function renderDialog(overrides?: Partial<React.ComponentProps<typeof ReportProblemDialog>>) {
  const onOpenChange = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue({
    referenceId: "PR-2026-00042",
    supportBundleAttachWarning: null,
  });

  render(
    <ReportProblemDialog
      open
      onOpenChange={onOpenChange}
      context={sampleContext}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );

  return { onOpenChange, onSubmit };
}

describe("ReportProblemDialog (TB-784)", () => {
  it("renders buyer-safe summary fields", () => {
    renderDialog();

    expect(screen.getByText("run-42")).toBeInTheDocument();
    expect(screen.getByText("workspace-9")).toBeInTheDocument();
    expect(screen.getByText("corr-001")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-product-version")).toHaveTextContent(
      "Build 1842212345-1 · API abcdef123456 · UI abcdef123456",
    );
    expect(screen.getByTestId("report-problem-details-summary")).toBeInTheDocument();
  });

  it("formats structured product version display and detects API/UI mismatch", () => {
    expect(formatReportProblemProductVersionDisplay(sampleContext)).toBe(
      "Build 1842212345-1 · API abcdef123456 · UI abcdef123456",
    );
    expect(
      formatReportProblemProductVersionDisplay({
        ...sampleContext,
        uiCommitSha: "ffffffffffffffffffffffffffffffffffffffff",
      }),
    ).toBe("Build 1842212345-1 · API abcdef123456 · UI ffffffffffff");
  });

  it("keeps submit disabled until consent is checked", () => {
    renderDialog();

    const submitButton = screen.getByRole("button", { name: REPORT_PROBLEM_SUBMIT_LABEL });

    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByTestId("report-problem-consent"));

    expect(submitButton).toBeEnabled();
  });

  it("submits payload and shows acknowledgement with SLA copy", async () => {
    const { onSubmit } = renderDialog();

    fireEvent.change(screen.getByTestId("report-problem-operator-note"), {
      target: { value: "Export failed after seal." },
    });
    fireEvent.click(screen.getByTestId("report-problem-consent"));
    fireEvent.click(screen.getByRole("button", { name: REPORT_PROBLEM_SUBMIT_LABEL }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          consentGranted: true,
          operatorNote: "Export failed after seal.",
          attachSupportBundle: false,
          context: sampleContext,
        }),
      );
    });

    expect(
      screen.getByText(formatReportProblemAcknowledgement("PR-2026-00042")),
    ).toBeInTheDocument();
  });

  it("includes attachSupportBundle when optional bundle checkbox is checked", async () => {
    const { onSubmit } = renderDialog();

    fireEvent.click(screen.getByTestId("report-problem-consent"));
    fireEvent.click(screen.getByTestId("report-problem-attach-bundle"));
    fireEvent.click(screen.getByRole("button", { name: REPORT_PROBLEM_SUBMIT_LABEL }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          consentGranted: true,
          attachSupportBundle: true,
        }),
      );
    });
  });

  it("shows bundle attach warning on acknowledgement when submit returns one", async () => {
    const warning =
      "Your report was submitted, but the redacted support bundle could not be attached. You can download one from Administration → Support if needed.";

    renderDialog({
      onSubmit: vi.fn().mockResolvedValue({
        referenceId: "PR-2026-00043",
        supportBundleAttachWarning: warning,
      }),
    });

    fireEvent.click(screen.getByTestId("report-problem-consent"));
    fireEvent.click(screen.getByRole("button", { name: REPORT_PROBLEM_SUBMIT_LABEL }));

    await waitFor(() => {
      expect(screen.getByTestId("report-problem-bundle-attach-warning")).toHaveTextContent(warning);
    });
  });

  it("keeps attach bundle checkbox disabled until consent is granted", () => {
    renderDialog();

    expect(screen.getByTestId("report-problem-attach-bundle")).toBeDisabled();

    fireEvent.click(screen.getByTestId("report-problem-consent"));

    expect(screen.getByTestId("report-problem-attach-bundle")).toBeEnabled();
  });

  it("prefers correlation id over client request id for reference display", () => {
    expect(
      resolveReportProblemReferenceId({
        ...sampleContext,
        correlationId: "corr-primary",
        clientRequestId: "client-secondary",
      }),
    ).toBe("corr-primary");
  });

  it("formats product and UI version for summary display", () => {
    expect(formatReportProblemProductVersionDisplay(sampleContext)).toBe(
      "Build 1842212345-1 · API abcdef123456 · UI abcdef123456",
    );
    expect(
      formatReportProblemProductVersionDisplay({
        ...sampleContext,
        apiCommitSha: null,
        uiCommitSha: null,
        deployStamp: null,
      }),
    ).toContain("ArchLucid.Api 1.0.0");
  });

  it("has no serious axe violations in form state", async () => {
    const { container } = render(
      <ReportProblemDialog
        open
        onOpenChange={vi.fn()}
        context={sampleContext}
        onSubmit={vi.fn()}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ReportProblemTriggerButton (TB-784)", () => {
  it("renders canonical action label", async () => {
    const { ReportProblemTriggerButton } = await import("@/components/support/ReportProblemTriggerButton");
    const onClick = vi.fn();

    render(<ReportProblemTriggerButton onClick={onClick} />);

    fireEvent.click(screen.getByTestId("report-problem-trigger"));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Report problem" })).toBeInTheDocument();
  });
});
