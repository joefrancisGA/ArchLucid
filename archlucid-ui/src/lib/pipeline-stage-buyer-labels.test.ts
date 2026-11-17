import { describe, expect, it } from "vitest";

import { buyerPipelineStageName } from "@/lib/pipeline-stage-buyer-labels";

describe("buyerPipelineStageName", () => {
  it("returns buyer label when vocabulary pass is active", () => {
    expect(buyerPipelineStageName("context_ingestion", true)).toBe("Reading your evidence");
  });

  it("falls back to underscore replacement when vocabulary pass is inactive", () => {
    expect(buyerPipelineStageName("context_ingestion", false)).toBe("context ingestion");
  });

  it("labels unknown stages explicitly when vocabulary pass is active (P-14)", () => {
    expect(buyerPipelineStageName("unknown_stage", true)).toBe("Unknown pipeline stage (unknown stage)");
  });

  it("labels empty stage names as not stored (P-14)", () => {
    expect(buyerPipelineStageName("", true)).toBe("Pipeline stage was not stored.");
  });
});
