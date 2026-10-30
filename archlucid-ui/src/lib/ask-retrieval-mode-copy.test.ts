import { describe, expect, it } from "vitest";

import {
  ASK_RETRIEVAL_DEGRADED_LABEL,
  ASK_RETRIEVAL_MODE_NOT_STORED_LABEL,
  ASK_RETRIEVAL_NOT_DEGRADED_LABEL,
} from "@/lib/ask-retrieval-mode-copy";

describe("ask-retrieval-mode-copy", () => {
  it("uses honest labels for omitted and not-degraded retrieval", () => {
    expect(ASK_RETRIEVAL_MODE_NOT_STORED_LABEL).toBe("Retrieval mode was not stored.");
    expect(ASK_RETRIEVAL_DEGRADED_LABEL).toBe(
      "Retrieval was degraded on this answer (text search instead of vector search).",
    );
    expect(ASK_RETRIEVAL_NOT_DEGRADED_LABEL).toBe(
      "Retrieval was stored as not degraded (vector search).",
    );
  });
});
