import { describe, expect, it } from "vitest";

import {
  AGENT_FINDINGS_STREAM_COUNT_NOT_STORED,
  SEALED_FINDINGS_STREAM_COUNT_NOT_STORED,
  formatFindingStreamDualCountLine,
} from "@/lib/finding-stream-product-of-record-copy";

describe("finding-stream-product-of-record-copy (P-08)", () => {
  it("labels omitted stream counts without coercing to zero", () => {
    const line = formatFindingStreamDualCountLine(null, undefined);

    expect(line).toContain(SEALED_FINDINGS_STREAM_COUNT_NOT_STORED);
    expect(line).toContain(AGENT_FINDINGS_STREAM_COUNT_NOT_STORED);
    expect(formatFindingStreamDualCountLine(2, 1)).toContain("2");
    expect(formatFindingStreamDualCountLine(2, 1)).toContain("1");
  });
});
