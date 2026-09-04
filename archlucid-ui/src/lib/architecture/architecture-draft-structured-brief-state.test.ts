import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  isUnknownConfirmSentinel,
} from "@/lib/architecture/architecture-draft-structured-brief-state";

describe("architecture-draft-structured-brief-state (RS-12)", () => {
  it("treats dash variants of the unknown sentinel as unconfirmed", () => {
    expect(isUnknownConfirmSentinel(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)).toBe(true);
    expect(isUnknownConfirmSentinel("Unknown - confirm before review")).toBe(true);
    expect(isUnknownConfirmSentinel("unknown — confirm before review")).toBe(true);
    expect(isUnknownConfirmSentinel("Confirmed constraint")).toBe(false);
  });
});
