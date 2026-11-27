import { describe, expect, it } from "vitest";

import { SECURENOW_AGENT_READINESS_NOT_AUTONOMOUS_LINE } from "@/lib/product-line/securenow-agent-readiness-substrate-copy";
import { SECURENOW_PATH_INSPECT_CITATION_ALLOWED_REFS_LEAD } from "@/lib/product-line/securenow-path-inspect-citation-allowed-copy";
import { SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE } from "@/lib/product-line/securenow-path-inspect-copy";

describe("score lift round151 wave H4 honesty", () => {
  it("bounds agent explanations and denies autonomous agents", () => {
    expect(SECURENOW_PATH_INSPECT_RANK_MODE_DISCIPLINE).toContain("rank weights are unchanged");
    expect(SECURENOW_PATH_INSPECT_CITATION_ALLOWED_REFS_LEAD).toContain("hop evidence");
    expect(SECURENOW_AGENT_READINESS_NOT_AUTONOMOUS_LINE).toContain("autonomous agent");
  });
});
