import { describe, expect, it } from "vitest";

import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";

describe("buyerPipelineStageName", () => {
  it("returns buyer label when polished shell is active", () => {
    expect(buyerPipelineStageName("context_ingestion", true)).toBe("Reading your evidence");
  });

  it("falls back to underscore replacement when polished shell is inactive", () => {
    expect(buyerPipelineStageName("context_ingestion", false)).toBe("context ingestion");
  });

  it("falls back gracefully for unknown stages in polished shell", () => {
    expect(buyerPipelineStageName("unknown_stage", true)).toBe("unknown stage");
  });
});
