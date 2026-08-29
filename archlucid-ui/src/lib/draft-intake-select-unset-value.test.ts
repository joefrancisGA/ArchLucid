import { describe, expect, it } from "vitest";

import {
  DRAFT_INTAKE_SELECT_UNSET_VALUE,
  resolveDraftIntakeSelectChange,
  resolveDraftIntakeSelectValue,
} from "./draft-intake-select-unset-value";

describe("draft-intake-select-unset-value", () => {
  it("maps empty strings to the unset sentinel for controlled Select values", () => {
    expect(resolveDraftIntakeSelectValue("")).toBe(DRAFT_INTAKE_SELECT_UNSET_VALUE);
    expect(resolveDraftIntakeSelectValue("Azure")).toBe("Azure");
  });

  it("maps the unset sentinel back to empty string for persisted answers", () => {
    expect(resolveDraftIntakeSelectChange(DRAFT_INTAKE_SELECT_UNSET_VALUE)).toBe("");
    expect(resolveDraftIntakeSelectChange("Azure")).toBe("Azure");
  });
});
