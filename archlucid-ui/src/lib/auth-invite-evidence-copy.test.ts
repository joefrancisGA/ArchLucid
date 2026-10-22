import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_CANONICAL_PATH,
  AUTH_INVITE_CLAIM_DISCIPLINE,
  AUTH_INVITE_CLAIM_DISCIPLINE_HEADING,
  AUTH_INVITE_FOLLOW_UPS_TITLE,
  AUTH_INVITE_SOURCES,
  AUTH_INVITE_SOURCES_INTRO,
} from "@/lib/auth-invite-evidence-copy";

describe("auth-invite-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for AUI orientation", () => {
    expect(AUTH_INVITE_CANONICAL_PATH).toBe("/auth/invite");
    expect(AUTH_INVITE_CLAIM_DISCIPLINE_HEADING.length).toBeGreaterThan(0);
    expect(AUTH_INVITE_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(AUTH_INVITE_CLAIM_DISCIPLINE).toContain("invitation accept");
    expect(AUTH_INVITE_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(AUTH_INVITE_SOURCES.length).toBeGreaterThan(0);

    for (const link of AUTH_INVITE_SOURCES) {
      expect(link.href).not.toBe(AUTH_INVITE_CANONICAL_PATH);
    }
  });
});
