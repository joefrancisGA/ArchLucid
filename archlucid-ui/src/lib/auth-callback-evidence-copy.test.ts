import { describe, expect, it } from "vitest";

import {
  AUTH_CALLBACK_CANONICAL_PATH,
  AUTH_CALLBACK_CLAIM_DISCIPLINE,
  AUTH_CALLBACK_CLAIM_DISCIPLINE_HEADING,
  AUTH_CALLBACK_FOLLOW_UPS_TITLE,
  AUTH_CALLBACK_SOURCES,
  AUTH_CALLBACK_SOURCES_INTRO,
} from "@/lib/auth-callback-evidence-copy";

describe("auth-callback-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for ACB orientation", () => {
    expect(AUTH_CALLBACK_CANONICAL_PATH).toBe("/auth/callback");
    expect(AUTH_CALLBACK_CLAIM_DISCIPLINE_HEADING.length).toBeGreaterThan(0);
    expect(AUTH_CALLBACK_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(AUTH_CALLBACK_CLAIM_DISCIPLINE).toContain("authentication handoff");
    expect(AUTH_CALLBACK_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(AUTH_CALLBACK_SOURCES.length).toBeGreaterThan(0);

    for (const link of AUTH_CALLBACK_SOURCES) {
      expect(link.href).not.toBe(AUTH_CALLBACK_CANONICAL_PATH);
    }
  });
});
