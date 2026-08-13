import { afterEach, describe, expect, it } from "vitest";

import {
  SCOPE_CHANGE_CONSEQUENCE_DISMISS_KEY_PREFIX,
  SCOPE_CHANGE_CONSEQUENCE_DISMISS_LABEL,
  SCOPE_CHANGE_CONSEQUENCE_HEADING,
  SCOPE_CHANGE_CONSEQUENCE_HONESTY,
  SCOPE_CHANGE_CONSEQUENCE_LEAD,
  buildScopeChangeConsequenceBanner,
  buildScopeChangeEventKey,
  dismissScopeChangeConsequence,
  isScopeChangeConsequenceDismissed,
} from "@/lib/scope-change-consequence-banner";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

describe("scope-change-consequence-banner (TB-2288)", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("builds buyer-safe consequence copy distinct from first-open coach", () => {
    const model = buildScopeChangeConsequenceBanner();

    expect(model.heading).toBe(SCOPE_CHANGE_CONSEQUENCE_HEADING);
    expect(model.lead).toBe(SCOPE_CHANGE_CONSEQUENCE_LEAD);
    expect(model.honesty).toBe(SCOPE_CHANGE_CONSEQUENCE_HONESTY);
    expect(model.dismissLabel).toBe(SCOPE_CHANGE_CONSEQUENCE_DISMISS_LABEL);
    expect(model.lead.toLowerCase()).toContain("follow");
    expect(model.honesty.toLowerCase()).toContain("wrong scope");
    expect(model.honesty.toLowerCase()).toContain("not that data is missing");
  });

  it("builds a stable event key from scope IDs", () => {
    const record: OperatorScopeRecord = {
      tenantId: " t1 ",
      workspaceId: " w1 ",
      projectId: " p1 ",
      workspaceLabel: "Workspace",
      projectLabel: "Project",
    };

    expect(buildScopeChangeEventKey(record)).toBe("t1|w1|p1");
    expect(buildScopeChangeEventKey(null)).toBe("cleared");
  });

  it("dismisses per change event in sessionStorage", () => {
    const eventKey = "t1|w1|p1";

    expect(isScopeChangeConsequenceDismissed(eventKey)).toBe(false);
    dismissScopeChangeConsequence(eventKey);
    expect(isScopeChangeConsequenceDismissed(eventKey)).toBe(true);
    expect(
      window.sessionStorage.getItem(`${SCOPE_CHANGE_CONSEQUENCE_DISMISS_KEY_PREFIX}${eventKey}`),
    ).toBe("1");
    expect(isScopeChangeConsequenceDismissed("t1|w1|other")).toBe(false);
  });
});
