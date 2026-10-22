import { describe, expect, it } from "vitest";

import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_EXPORT_WINDOW_INCOMPLETE_MESSAGE,
  OPERATOR_DATE_RANGE_INPUT_CLASSNAME,
  OPERATOR_DATE_RANGE_LOCAL_TIME_SUFFIX,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "./operator-date-range-copy";

describe("operator-date-range-copy (TB-2012)", () => {
  it("uses Start date / End date buyer labels", () => {
    expect(OPERATOR_DATE_RANGE_START_LABEL).toBe("Start date");
    expect(OPERATOR_DATE_RANGE_END_LABEL).toBe("End date");
  });

  it("documents local wall-time honesty suffix", () => {
    expect(OPERATOR_DATE_RANGE_LOCAL_TIME_SUFFIX).toBe("(local)");
  });

  it("uses Start/End wording for export window incomplete copy", () => {
    expect(OPERATOR_DATE_RANGE_EXPORT_WINDOW_INCOMPLETE_MESSAGE).toMatch(/Start date/);
    expect(OPERATOR_DATE_RANGE_EXPORT_WINDOW_INCOMPLETE_MESSAGE).toMatch(/End date/);
  });

  it("constrains date input width for content-sized pickers", () => {
    expect(OPERATOR_DATE_RANGE_INPUT_CLASSNAME).toContain("max-w-[12rem]");
    expect(OPERATOR_DATE_RANGE_INPUT_CLASSNAME).toContain("w-auto");
  });
});
