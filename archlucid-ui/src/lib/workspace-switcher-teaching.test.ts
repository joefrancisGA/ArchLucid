import { afterEach, describe, expect, it, vi } from "vitest";

import {
  WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY,
  WORKSPACE_SWITCHER_TEACHING_DISMISS_LABEL,
  WORKSPACE_SWITCHER_TEACHING_HEADING,
  WORKSPACE_SWITCHER_TEACHING_LEAD,
  WORKSPACE_SWITCHER_TEACHING_STEPS,
  buildWorkspaceSwitcherTeaching,
  dismissWorkspaceSwitcherTeaching,
  isWorkspaceSwitcherTeachingDismissed,
} from "@/lib/workspace-switcher-teaching";

describe("workspace-switcher-teaching (TB-2234)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("teaches tenant → workspace → project hierarchy in buyer nouns", () => {
    const model = buildWorkspaceSwitcherTeaching();

    expect(model.heading).toBe(WORKSPACE_SWITCHER_TEACHING_HEADING);
    expect(model.lead).toBe(WORKSPACE_SWITCHER_TEACHING_LEAD);
    expect(model.lead.toLowerCase()).toContain("tenant");
    expect(model.lead.toLowerCase()).toContain("workspace");
    expect(model.lead.toLowerCase()).toContain("project");
    expect(model.dismissLabel).toBe(WORKSPACE_SWITCHER_TEACHING_DISMISS_LABEL);

    expect(model.steps).toEqual(WORKSPACE_SWITCHER_TEACHING_STEPS);
    expect(model.steps.map((step) => step.id)).toEqual(["tenant", "workspace", "project"]);
    expect(model.steps[0]?.body.toLowerCase()).toContain("organization");
    expect(model.steps[1]?.body.toLowerCase()).toContain("architecture package");
    expect(model.steps[2]?.body.toLowerCase()).toContain("review");
  });

  it("reads and writes the localStorage dismiss key", () => {
    expect(isWorkspaceSwitcherTeachingDismissed()).toBe(false);

    dismissWorkspaceSwitcherTeaching();

    expect(window.localStorage.getItem(WORKSPACE_SWITCHER_TEACHING_DISMISS_KEY)).toBe("1");
    expect(isWorkspaceSwitcherTeachingDismissed()).toBe(true);
  });

  it("treats localStorage failures as dismissed (private mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(isWorkspaceSwitcherTeachingDismissed()).toBe(true);
  });
});
