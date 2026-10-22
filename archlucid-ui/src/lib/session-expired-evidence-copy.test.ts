import { describe, expect, it } from "vitest";

import {
  SESSION_EXPIRED_CANONICAL_PATH,
  SESSION_EXPIRED_CLAIM_DISCIPLINE,
  SESSION_EXPIRED_CLAIM_DISCIPLINE_HEADING,
  SESSION_EXPIRED_FOLLOW_UPS_TITLE,
  SESSION_EXPIRED_SOURCES,
  SESSION_EXPIRED_SOURCES_INTRO,
} from "@/lib/session-expired-evidence-copy";

describe("session-expired-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for ASU orientation", () => {
    expect(SESSION_EXPIRED_CANONICAL_PATH).toBe("/auth/session-expired");
    expect(SESSION_EXPIRED_CLAIM_DISCIPLINE_HEADING.length).toBeGreaterThan(0);
    expect(SESSION_EXPIRED_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(SESSION_EXPIRED_CLAIM_DISCIPLINE).toContain("session ended");
    expect(SESSION_EXPIRED_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(SESSION_EXPIRED_SOURCES.length).toBeGreaterThan(0);

    for (const link of SESSION_EXPIRED_SOURCES) {
      expect(link.href).not.toBe(SESSION_EXPIRED_CANONICAL_PATH);
    }
  });
});
