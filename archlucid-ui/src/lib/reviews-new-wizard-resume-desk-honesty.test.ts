import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_WIZARD_RESUME_DESK_HONESTY } from "@/lib/reviews-new-wizard-resume-desk-honesty";

describe("reviews-new-wizard-resume-desk-honesty (P-11)", () => {
  it("distinguishes browser intake resume from architecture desk resume", () => {
    expect(REVIEWS_NEW_WIZARD_RESUME_DESK_HONESTY).toContain("Alt+R");
    expect(REVIEWS_NEW_WIZARD_RESUME_DESK_HONESTY.toLowerCase()).toContain("browser");
  });
});
