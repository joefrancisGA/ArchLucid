import { describe, expect, it } from "vitest";

import type { InpOffloadRequest } from "@/lib/workers/inp-offload-contract";
import { isInpOffloadSuccessResponse } from "@/lib/workers/inp-offload-contract";

describe("inp-offload-contract (TB-2166)", () => {
  it("accepts provenance layout requests with stable kind discriminator", () => {
    const request: InpOffloadRequest<"provenanceLayout"> = {
      id: "req-1",
      kind: "provenanceLayout",
      payload: {
        nodes: [],
        edges: [],
      },
    };

    expect(request.kind).toBe("provenanceLayout");
  });

  it("narrows success responses by ok flag", () => {
    const response = {
      id: "req-1",
      ok: true as const,
      kind: "manifestLineDiff" as const,
      result: [{ kind: "equal" as const, prefix: " ", text: "same" }],
    };

    expect(isInpOffloadSuccessResponse(response)).toBe(true);
    expect(response.result).toHaveLength(1);
  });

  it("rejects error responses from success narrowing", () => {
    const response = {
      id: "req-1",
      ok: false as const,
      error: "boom",
    };

    expect(isInpOffloadSuccessResponse(response)).toBe(false);
  });
});
