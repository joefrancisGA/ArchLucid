import { describe, expect, it } from "vitest";

import { SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY } from "@/lib/semantic-support-band-async-honesty";

describe("semantic support band async honesty (AS-058)", () => {
  it("documents async may lag and is not a commit gate", () => {
    expect(SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY).toMatch(/async/i);
    expect(SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY).toMatch(/may lag/i);
    expect(SEMANTIC_SUPPORT_BAND_ASYNC_MAY_LAG_COPY).toMatch(/not a commit gate/i);
  });
});
