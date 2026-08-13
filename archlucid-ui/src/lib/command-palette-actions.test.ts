import { describe, expect, it } from "vitest";

import { COMMAND_PALETTE_ACTIONS } from "@/lib/command-palette-actions";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";

describe("command-palette-actions (TB-1963)", () => {
  it("opens sponsor report on canonical sponsor-report path", () => {
    const valueReportAction = COMMAND_PALETTE_ACTIONS.find((action) => action.id === "action-export-value");

    expect(valueReportAction).toBeDefined();
    expect(valueReportAction?.href).toBe(SPONSOR_REPORT_PATH);
    expect(valueReportAction?.href).not.toBe("/value-report");
  });
});
