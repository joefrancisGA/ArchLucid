import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX,
  formatUnmatchedArchitectureDataFlowLine,
} from "@/lib/architecture/architecture-diagram-copy";

describe("formatUnmatchedArchitectureDataFlowLine (P-01)", () => {
  it("does not double-prefix lines that already include the omission prefix", () => {
    const flow = `${ARCHITECTURE_DIAGRAM_DATA_FLOW_NOT_MATCHED_PREFIX} Gateway -> sink`;

    expect(formatUnmatchedArchitectureDataFlowLine(flow)).toBe(flow);
  });
});
