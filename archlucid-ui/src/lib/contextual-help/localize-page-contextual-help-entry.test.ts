import { describe, expect, it } from "vitest";

import { localizePageContextualHelpEntry } from "@/lib/contextual-help/localize-page-contextual-help-entry";
import type { PageContextualHelpEntry } from "@/lib/contextual-help/types";

const TEAMS_ENTRY: PageContextualHelpEntry = {
  whatIsThisPage:
    "Microsoft Teams integration — configure a Teams channel destination that receives alerts for this workspace.",
  whatToDoNext: "Save or test the Teams connector, then open Alert rules.",
  whyEmpty: "Connection status appears after this workspace can load Teams notification settings.",
  taskSteps: ["Send a test notification to confirm Teams delivery."],
};

describe("localizePageContextualHelpEntry", () => {
  it("leaves architecture copy unchanged", () => {
    expect(localizePageContextualHelpEntry(TEAMS_ENTRY, "architecture")).toBe(TEAMS_ENTRY);
    expect(localizePageContextualHelpEntry(TEAMS_ENTRY, "architecture").whatIsThisPage).toContain(
      "Microsoft Teams",
    );
  });

  it("shortens Microsoft Teams to Teams in SecureNow drawer copy", () => {
    const localized = localizePageContextualHelpEntry(TEAMS_ENTRY, "security");

    expect(localized.whatIsThisPage).toBe(
      "Teams integration — configure a Teams channel destination that receives alerts for this workspace.",
    );
    expect(localized.whatIsThisPage).not.toContain("Microsoft Teams");
    expect(localized.whatToDoNext).not.toContain("Microsoft Teams");
  });
});
