import { describe, expect, it } from "vitest";

import { DIGEST_SPONSOR_CANONICAL_PATH, DIGEST_SPONSOR_SOURCES } from "@/lib/marketing/digest-sponsor-evidence-copy";

describe("digest-sponsor-evidence-copy", () => {
  it("does not self-link tokenized digest sponsor URLs in Sources", () => {
    expect(DIGEST_SPONSOR_SOURCES.some((link) => link.href === DIGEST_SPONSOR_CANONICAL_PATH)).toBe(false);
    expect(DIGEST_SPONSOR_SOURCES.some((link) => link.href.includes("token="))).toBe(false);
  });
});
