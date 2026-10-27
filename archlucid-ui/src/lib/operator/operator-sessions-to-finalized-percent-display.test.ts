import { describe, expect, it } from "vitest";

import { presentOperatorSessionsToFinalizedPercent } from "@/lib/operator/operator-sessions-to-finalized-percent-display";

describe("presentOperatorSessionsToFinalizedPercent", () => {
  it("explains zero sessions", () => {
    expect(presentOperatorSessionsToFinalizedPercent(0.5, 0).display).toBe("No sessions yet");
  });

  it("rejects ratios above 1", () => {
    expect(presentOperatorSessionsToFinalizedPercent(1.2, 3).display).toBe("Not usable");
  });

  it("rejects negative ratios instead of showing 0%", () => {
    const presentation = presentOperatorSessionsToFinalizedPercent(-0.25, 10);

    expect(presentation.display).toBe("Not usable");
    expect(presentation.footnote).toContain("negative");
  });

  it("formats valid conversion", () => {
    expect(presentOperatorSessionsToFinalizedPercent(0.5, 4).display).toBe("50%");
  });
});
