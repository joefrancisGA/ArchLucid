import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AlertsInboxSummaryRow,
  resolveAlertsSummaryCountDisplay,
} from "@/components/alerts/AlertsInboxSummaryRow";
import {
  ALERTS_SUMMARY_ACKNOWLEDGED_LABEL,
  ALERTS_SUMMARY_BLOCKING_LABEL,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA,
  ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NO_RULES_ARIA,
  ALERTS_SUMMARY_LAST_EVALUATED_NEVER,
  ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED,
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
      ALERTS_SUMMARY_BLOCKING_LABEL,
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

    expect(within(row).getByText(ALERTS_SUMMARY_LAST_EVALUATED_RULES_NOT_CONFIGURED)).toBeInTheDocument();
  });

  it("renders numeric counters when rules exist and an evaluation has run", () => {
    render(
      <AlertsInboxSummaryRow
        summary={{
          open: 2,
          acknowledged: 1,
          resolved: 0,
          blocking: 3,
          lastEvaluatedUtc: "2026-08-08T12:00:00Z",
        }}
        loading={false}
        hasAlertRules={true}
        workspaceContextLoading={false}
      />,
    );

    const row = screen.getByTestId("alerts-inbox-summary-row");
    expect(within(row).getByText("2")).toBeInTheDocument();
    expect(within(row).getByText("1")).toBeInTheDocument();
    expect(within(row).getByText("0")).toBeInTheDocument();
    expect(within(row).getByText("3")).toBeInTheDocument();
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
    expect(within(row).getAllByLabelText(ALERTS_SUMMARY_COUNT_NOT_EVALUATED_NEVER_RUN_ARIA)).toHaveLength(4);
    expect(within(row).getByText(ALERTS_SUMMARY_LAST_EVALUATED_NEVER)).toBeInTheDocument();
  });
});
