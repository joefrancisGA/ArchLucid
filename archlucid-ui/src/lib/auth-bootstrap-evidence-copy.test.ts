import { describe, expect, it } from "vitest";

import {
  AUTH_BOOTSTRAP_CANONICAL_PATH,
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE,
  AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING,
  AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE,
  AUTH_BOOTSTRAP_SOURCES,
  AUTH_BOOTSTRAP_SOURCES_INTRO,
} from "@/lib/auth-bootstrap-evidence-copy";

describe("auth-bootstrap-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for AUB orientation", () => {
    expect(AUTH_BOOTSTRAP_CANONICAL_PATH).toBe("/auth/bootstrap");
    expect(AUTH_BOOTSTRAP_CLAIM_DISCIPLINE_HEADING.length).toBeGreaterThan(0);
    expect(AUTH_BOOTSTRAP_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(AUTH_BOOTSTRAP_CLAIM_DISCIPLINE).toContain("workspace setup");
    expect(AUTH_BOOTSTRAP_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(AUTH_BOOTSTRAP_SOURCES.length).toBeGreaterThan(0);

    for (const link of AUTH_BOOTSTRAP_SOURCES) {
      expect(link.href).not.toBe(AUTH_BOOTSTRAP_CANONICAL_PATH);
    }
  });
});
