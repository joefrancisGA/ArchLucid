import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlertsInboxSummaryRow,
  resolveAlertsSummaryCountDisplay,
  resolveOpenAlertsSummaryDisplay,
} from "@/components/alerts/AlertsInboxSummaryRow";
import {
  ALERTS_SUMMARY_ACKNOWLEDGED_LABEL,
  ALERTS_SUMMARY_BLOCKING_LABEL,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA,
  ALERTS_SUMMARY_LAST_EVALUATED_NEVER,
  ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED,
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
    expect(display.tileTitle).toBe(ALERTS_SUMMARY_OPEN_BLOCKING_RELATIONSHIP_TITLE);
  });
});

describe("AlertsInboxSummaryRow", () => {
  it("does not render numeric 0 counters when alert rules are not configured", () => {
    render(
      <AlertsInboxSummaryRow
        summary={ZERO_SUMMARY}
        loading={false}
        hasAlertRules={false}
        workspaceContextLoading={false}
      />,
    );

    const row = screen.getByTestId("alerts-inbox-summary-row");
    const countLabels = [
      ALERTS_SUMMARY_OPEN_LABEL,
      ALERTS_SUMMARY_ACKNOWLEDGED_LABEL,
      ALERTS_SUMMARY_RESOLVED_LABEL,
    ];

    for (const label of countLabels) {
      const tile = within(row).getByText(label).parentElement;
      expect(tile).not.toBeNull();
      expect(within(tile as HTMLElement).queryByText("0")).toBeNull();
      expect(within(tile as HTMLElement).getByText(ALERTS_SUMMARY_COUNT_NOT_EVALUATED)).toHaveAttribute(
        "aria-label",
        ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA,
      );
    }

    expect(within(row).queryByText(ALERTS_SUMMARY_BLOCKING_LABEL)).toBeNull();
    expect(within(row).getByText(ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED)).toBeInTheDocument();
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
    const openTile = within(row).getByText(ALERTS_SUMMARY_OPEN_LABEL).parentElement;

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
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(within(row).getByText("0")).toBeInTheDocument();
  });

  it("keeps counters unmeasured when rules exist but never evaluated", () => {
    render(
      <AlertsInboxSummaryRow
        summary={ZERO_SUMMARY}
        loading={false}
        hasAlertRules={true}
        workspaceContextLoading={false}
      />,
    );

    const row = screen.getByTestId("alerts-inbox-summary-row");
    expect(within(row).queryByText("0")).toBeNull();
    expect(within(row).getAllByLabelText(ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA)).toHaveLength(3);
    expect(within(row).getByText(ALERTS_SUMMARY_LAST_EVALUATED_NEVER)).toBeInTheDocument();
  });
});
