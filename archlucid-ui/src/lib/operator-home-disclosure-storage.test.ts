import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE,
  OPERATOR_HOME_DISCLOSURE_EXPANDED_VALUE,
  OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS,
  collapseAriaLabel,
  expandAriaLabel,
  readOperatorHomeDisclosureExpanded,
  writeOperatorHomeDisclosureExpanded,
} from "@/lib/operator-home-disclosure-storage";

describe("operator-home-disclosure-storage", () => {
  it("reads legacy minimized keys as collapsed", () => {
    localStorage.setItem("archlucid_core_pilot_next_steps_minimized_v1", OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE);

    expect(
      readOperatorHomeDisclosureExpanded(
        OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.recommendedFirstSessionPath,
        true,
        ["archlucid_core_pilot_next_steps_minimized_v1"],
      ),
    ).toBe(false);
  });

  it("persists expanded and collapsed values", () => {
    writeOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere, false);
    expect(localStorage.getItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere)).toBe(
      OPERATOR_HOME_DISCLOSURE_COLLAPSED_VALUE,
    );

    writeOperatorHomeDisclosureExpanded(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere, true);
    expect(localStorage.getItem(OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.pilotStartHere)).toBe(
      OPERATOR_HOME_DISCLOSURE_EXPANDED_VALUE,
    );
  });

  it("builds accessible toggle labels", () => {
    expect(collapseAriaLabel("Workspace readiness")).toBe("Collapse Workspace readiness");
    expect(expandAriaLabel("Workspace readiness")).toBe("Expand Workspace readiness");
  });
});
