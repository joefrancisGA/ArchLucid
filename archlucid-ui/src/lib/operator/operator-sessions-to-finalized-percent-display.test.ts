import { describe, expect, it } from "vitest";

import { presentOperatorSessionsToFinalizedPercent } from "@/lib/operator/operator-sessions-to-finalized-percent-display";

describe("presentOperatorSessionsToFinalizedPercent", () => {
  it("explains zero sessions", () => {
    expect(presentOperatorSessionsToFinalizedPercent(0.5, 0).display).toBe("No sessions yet");
  });

  it("rejects ratios above 1", () => {
    expect(presentOperatorSessionsToFinalizedPercent(1.2, 3).display).toBe("Not usable");
  });

  it("formats valid conversion", () => {
    expect(presentOperatorSessionsToFinalizedPercent(0.5, 4).display).toBe("50%");
  });
});
