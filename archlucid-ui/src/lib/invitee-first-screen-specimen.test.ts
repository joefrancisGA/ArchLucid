import { describe, expect, it } from "vitest";

import {
  INVITEE_FIRST_SCREEN_SPECIMEN_HEADING,
  INVITEE_FIRST_SCREEN_SPECIMEN_LEAD,
  INVITEE_FIRST_SCREEN_SPECIMEN_STEPS,
  buildInviteeFirstScreenSpecimen,
} from "@/lib/invitee-first-screen-specimen";

describe("invitee-first-screen-specimen (TB-2235)", () => {
  it("teaches finding → disposition → comment in buyer nouns", () => {
    const model = buildInviteeFirstScreenSpecimen();

    expect(model.heading).toBe(INVITEE_FIRST_SCREEN_SPECIMEN_HEADING);
    expect(model.lead).toBe(INVITEE_FIRST_SCREEN_SPECIMEN_LEAD);
    expect(model.lead.toLowerCase()).toContain("finding");
    expect(model.lead.toLowerCase()).toContain("disposition");
    expect(model.lead.toLowerCase()).toContain("comment");
    expect(model.lead.toLowerCase()).toContain("architecture package");

    expect(model.steps).toEqual(INVITEE_FIRST_SCREEN_SPECIMEN_STEPS);
    expect(model.steps.map((step) => step.id)).toEqual(["finding", "disposition", "comment"]);
    expect(model.steps[0]?.body.toLowerCase()).toContain("evidence trail");
    expect(model.steps[1]?.body.toLowerCase()).toContain("decision register");
    expect(model.steps[2]?.body.toLowerCase()).toContain("architecture owner");
  });
});
