import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlertsInboxSummaryRow,
  resolveAlertsSummaryCountDisplay,
  resolveOpenAlertsSummaryDisplay,
  shouldShowAlertsInboxSummaryRow,
} from "@/components/alerts/AlertsInboxSummaryRow";
import {
  ALERTS_SUMMARY_ACKNOWLEDGED_LABEL,
  ALERTS_SUMMARY_BLOCKING_LABEL,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA,
  ALERTS_SUMMARY_OPEN_BLOCKING_RELATIONSHIP_TITLE,
  ALERTS_SUMMARY_OPEN_LABEL,
  ALERTS_SUMMARY_RESOLVED_LABEL,
} from "@/lib/alerts-page-copy";

const ZERO_SUMMARY = {
  open: 0,
  acknowledged: 0,
  resolved: 0,
  blocking: 0,
  lastEvaluatedUtc: null as string | null,
};

const MEASURED_CONTEXT = {
  loading: false,
  workspaceContextLoading: false,
  hasAlertRules: true,
  lastEvaluatedUtc: "2026-08-08T12:00:00Z",
};

describe("resolveAlertsSummaryCountDisplay", () => {
  it("keeps the loading placeholder while summary or workspace context loads", () => {
    expect(
      resolveAlertsSummaryCountDisplay({
        value: 0,
        loading: true,
        workspaceContextLoading: false,
        hasAlertRules: false,
        lastEvaluatedUtc: null,
      }).value,
    ).toBe("…");
    expect(
      resolveAlertsSummaryCountDisplay({
        value: 0,
        loading: false,
        workspaceContextLoading: true,
        hasAlertRules: true,
        lastEvaluatedUtc: null,
      }).value,
    ).toBe("…");
  });

  it("uses the not-evaluated sentinel when no alert rules exist", () => {
    const display = resolveAlertsSummaryCountDisplay({
      value: 0,
      loading: false,
      workspaceContextLoading: false,
      hasAlertRules: false,
      lastEvaluatedUtc: null,
    });

    expect(display.value).toBe(ALERTS_SUMMARY_COUNT_NOT_EVALUATED);
    expect(display.valueAriaLabel).toBe(ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA);
  });

  it("uses the not-evaluated sentinel when rules exist but never evaluated", () => {
    const display = resolveAlertsSummaryCountDisplay({
      value: 0,
      loading: false,
      workspaceContextLoading: false,
      hasAlertRules: true,
      lastEvaluatedUtc: null,
    });

    expect(display.value).toBe(ALERTS_SUMMARY_COUNT_NOT_EVALUATED);
    expect(display.valueAriaLabel).toBe(ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA);
  });

  it("renders numeric counts once rules exist and an evaluation timestamp is present", () => {
    const display = resolveAlertsSummaryCountDisplay({
      value: 0,
      loading: false,
      workspaceContextLoading: false,
      hasAlertRules: true,
      lastEvaluatedUtc: "2026-08-08T12:00:00Z",
    });

    expect(display.value).toBe("0");
    expect(display.valueAriaLabel).toBeUndefined();
  });
});

describe("resolveOpenAlertsSummaryDisplay", () => {
  it("keeps the loading placeholder while summary or workspace context loads", () => {
    expect(
      resolveOpenAlertsSummaryDisplay({
        open: 3,
        blocking: 2,
        loading: true,
        workspaceContextLoading: false,
        hasAlertRules: true,
        lastEvaluatedUtc: "2026-08-08T12:00:00Z",
      }).value,
    ).toBe("…");
    expect(
      resolveOpenAlertsSummaryDisplay({
        open: 3,
        blocking: 2,
        loading: false,
        workspaceContextLoading: true,
        hasAlertRules: true,
        lastEvaluatedUtc: "2026-08-08T12:00:00Z",
      }).value,
    ).toBe("…");
  });

  it("nests blocking inside the open tile when measured", () => {
    const display = resolveOpenAlertsSummaryDisplay({
      open: 3,
      blocking: 2,
      ...MEASURED_CONTEXT,
    });

    expect(display.value).toBe("3 open · 2 blocking");
    expect(display.valueAriaLabel).toContain("3 open alerts");
    expect(display.valueAriaLabel).toContain("2 blocking of open");
    expect(display.labelHint).toBe(ALERTS_SUMMARY_OPEN_BLOCKING_RELATIONSHIP_TITLE);
  });
});

describe("shouldShowAlertsInboxSummaryRow", () => {
  it("TB-1597: hides the summary strip when rules are absent after workspace context settles", () => {
    expect(
      shouldShowAlertsInboxSummaryRow({
        hasAlertRules: false,
        workspaceContextLoading: false,
        summaryLoading: false,
        lastEvaluatedUtc: null,
      }),
    ).toBe(false);
  });

  it("keeps the summary strip visible while workspace context or summary is loading", () => {
    expect(
      shouldShowAlertsInboxSummaryRow({
        hasAlertRules: false,
        workspaceContextLoading: true,
        summaryLoading: false,
        lastEvaluatedUtc: null,
      }),
    ).toBe(true);
    expect(
      shouldShowAlertsInboxSummaryRow({
        hasAlertRules: true,
        workspaceContextLoading: false,
        summaryLoading: true,
        lastEvaluatedUtc: null,
      }),
    ).toBe(true);
  });

  it("hides the summary strip until evaluation has produced a timestamp", () => {
    expect(
      shouldShowAlertsInboxSummaryRow({
        hasAlertRules: true,
        workspaceContextLoading: false,
        summaryLoading: false,
        lastEvaluatedUtc: null,
      }),
    ).toBe(false);
  });

  it("shows the summary strip once rules exist and evaluation has run", () => {
    expect(
      shouldShowAlertsInboxSummaryRow({
        hasAlertRules: true,
        workspaceContextLoading: false,
        summaryLoading: false,
        lastEvaluatedUtc: "2026-08-08T12:00:00Z",
      }),
    ).toBe(true);
  });
});

describe("AlertsInboxSummaryRow", () => {
  it("TB-1597: does not render the summary strip when alert rules are not configured", () => {
    render(
      <AlertsInboxSummaryRow
        summary={ZERO_SUMMARY}
        loading={false}
        hasAlertRules={false}
        workspaceContextLoading={false}
      />,
    );

    expect(screen.queryByTestId("alerts-inbox-summary-row")).not.toBeInTheDocument();
  });

  it("nests blocking under open and omits a separate blocking tile", () => {
    render(
      <AlertsInboxSummaryRow
        summary={{
          open: 3,
          acknowledged: 1,
          resolved: 0,
          blocking: 2,
          lastEvaluatedUtc: "2026-08-08T12:00:00Z",
        }}
        loading={false}
        hasAlertRules={true}
        workspaceContextLoading={false}
      />,
    );

    const row = screen.getByTestId("alerts-inbox-summary-row");
    const openLabel = within(row).getByText(ALERTS_SUMMARY_OPEN_LABEL);
    const openTile = openLabel.closest("div.rounded-md");

    expect(openTile).not.toBeNull();
    expect(within(openTile as HTMLElement).getByText("3 open · 2 blocking")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("3 open alerts"),
    );
    expect(within(openTile as HTMLElement).getByText("3 open · 2 blocking")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("2 blocking of open"),
    );
    expect(within(row).queryByText(ALERTS_SUMMARY_BLOCKING_LABEL)).toBeNull();
    expect(
      screen.getByRole("button", { name: /help: open alerts/i }),
    ).toBeInTheDocument();
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(within(row).getByText("0")).toBeInTheDocument();
  });

  it("TB-1597: does not render the summary strip before the first evaluation", () => {
    render(
      <AlertsInboxSummaryRow
        summary={ZERO_SUMMARY}
        loading={false}
        hasAlertRules={true}
        workspaceContextLoading={false}
      />,
    );

    expect(screen.queryByTestId("alerts-inbox-summary-row")).not.toBeInTheDocument();
  });
});
