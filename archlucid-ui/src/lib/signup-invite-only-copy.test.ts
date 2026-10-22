import { describe, expect, it } from "vitest";

import {
  SIGNUP_INVITE_ONLY_OUTCOMES,
  SIGNUP_INVITE_ONLY_PANEL_LEAD,
  SIGNUP_INVITE_ONLY_RESPONSE_TIME,
  SIGNUP_INVITE_ONLY_SUBMIT_LABEL,
  SIGNUP_PAGE_INVITE_ONLY_LEAD,
} from "@/lib/signup-invite-only-copy";

describe("signup-invite-only-copy", () => {
  it("avoids private-beta and seat-scarcity framing", () => {
    const blob = [
      SIGNUP_INVITE_ONLY_PANEL_LEAD,
      SIGNUP_PAGE_INVITE_ONLY_LEAD,
      ...SIGNUP_INVITE_ONLY_OUTCOMES.map((o) => `${o.label} ${o.detail}`),
    ].join(" ");

    expect(blob.toLowerCase()).not.toMatch(/private beta/);
    expect(blob.toLowerCase()).not.toMatch(/seat is available/);
    expect(blob.toLowerCase()).not.toMatch(/when a seat/);
  });

  it("states a concrete follow-up window and submit-not-gate CTA", () => {
    expect(SIGNUP_INVITE_ONLY_RESPONSE_TIME).toMatch(/two business days/i);
    expect(SIGNUP_INVITE_ONLY_SUBMIT_LABEL).toMatch(/Send evaluation request/i);
    expect(SIGNUP_INVITE_ONLY_SUBMIT_LABEL.toLowerCase()).not.toBe("request access");
  });
});
