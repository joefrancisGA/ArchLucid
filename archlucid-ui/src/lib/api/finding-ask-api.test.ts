import { describe, expect, it } from "vitest";

import { findingIdForAskRoute } from "./finding-ask-api";

describe("findingIdForAskRoute", () => {
  it("converts 32-char hex to dashed GUID", () => {
    expect(findingIdForAskRoute("0123456789abcdef0123456789abcdef")).toBe(
      "01234567-89ab-cdef-0123-456789abcdef",
    );
  });

  it("passes through already dashed GUIDs", () => {
    const dashed = "01234567-89ab-cdef-0123-456789abcdef";
    expect(findingIdForAskRoute(dashed)).toBe(dashed);
  });
});
