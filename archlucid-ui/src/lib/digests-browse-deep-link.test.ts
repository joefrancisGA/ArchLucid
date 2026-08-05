import { describe, expect, it } from "vitest";

import {
  DIGEST_HASH_PREFIX,
  digestHashFragment,
  digestIdFromLocationHash,
  digestRowElementId,
} from "@/lib/digests-browse-deep-link";

describe("digests browse deep link (TB-1501)", () => {
  it("builds a row id the hash fragment can target", () => {
    expect(digestRowElementId("d1")).toBe("digest-d1");
    expect(digestHashFragment("d1")).toBe("#digest-d1");
  });

  it("round-trips the id the hub Preview action produces", () => {
    const fragment = digestHashFragment("d1");

    expect(digestIdFromLocationHash(fragment)).toBe("d1");
  });

  it("accepts a fragment with or without the leading hash", () => {
    expect(digestIdFromLocationHash("digest-abc")).toBe("abc");
    expect(digestIdFromLocationHash("#digest-abc")).toBe("abc");
  });

  it("decodes percent-encoded ids", () => {
    expect(digestIdFromLocationHash(`#${DIGEST_HASH_PREFIX}a%20b`)).toBe("a b");
  });

  it("returns the raw id when the encoding is malformed", () => {
    expect(digestIdFromLocationHash("#digest-100%")).toBe("100%");
  });

  it("ignores unrelated anchors and empty fragments", () => {
    expect(digestIdFromLocationHash("#exports")).toBeNull();
    expect(digestIdFromLocationHash("#digest-")).toBeNull();
    expect(digestIdFromLocationHash("")).toBeNull();
    expect(digestIdFromLocationHash(null)).toBeNull();
    expect(digestIdFromLocationHash(undefined)).toBeNull();
  });
});
