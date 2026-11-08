import { describe, expect, it } from "vitest";

import { shouldClearIntakeWhenInboundRunIdDropped } from "./architecture-intelligence-page-helpers";

describe("shouldClearIntakeWhenInboundRunIdDropped", () => {
  const inboundA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const canonicalB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  it("preserves intake when contextRunId matches canonical active scope after inbound drop", () => {
    expect(
      shouldClearIntakeWhenInboundRunIdDropped(inboundA, "", canonicalB, canonicalB),
    ).toBe(false);
  });

  it("preserves intake when contextRunId matches the previous inbound run id", () => {
    expect(shouldClearIntakeWhenInboundRunIdDropped(inboundA, "", inboundA, inboundA)).toBe(false);
  });

  it("clears intake when contextRunId disagrees with both previous inbound and active scope", () => {
    const staleC = "cccccccc-cccc-cccc-cccc-cccccccccccc";

    expect(shouldClearIntakeWhenInboundRunIdDropped(inboundA, "", staleC, canonicalB)).toBe(true);
  });
});
