import { describe, expect, it } from "vitest";

import {
  API_KEYS_HELP_CANONICAL_PATH,
  API_KEYS_HELP_CLAIM_DISCIPLINE,
  API_KEYS_HELP_FOLLOW_UPS_TITLE,
  API_KEYS_HELP_ORIENTATION_SOURCES,
  API_KEYS_HELP_ORIENTATION_SOURCES_INTRO,
  API_KEYS_HELP_SOURCES,
} from "@/lib/api-keys-help-evidence-copy";

describe("api-keys-help-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for HEP", () => {
    expect(API_KEYS_HELP_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(API_KEYS_HELP_CLAIM_DISCIPLINE).toContain("This guide is not");
    expect(API_KEYS_HELP_ORIENTATION_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(API_KEYS_HELP_SOURCES.length).toBeGreaterThan(0);
    expect(API_KEYS_HELP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of API_KEYS_HELP_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(API_KEYS_HELP_CANONICAL_PATH);
    }
  });
});
