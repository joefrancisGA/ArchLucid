import { describe, expect, it } from "vitest";

import { DESIGN_TOKENS } from "@/lib/design-tokens";
import {
  recycleBinFeedbackCalloutClass,
  recycleBinFeedbackStatusKind,
} from "@/lib/projects-recycle-bin-feedback";

describe("projects-recycle-bin-feedback (TB-1182)", () => {
  it("maps feedback kinds to callout classes", () => {
    expect(recycleBinFeedbackCalloutClass("success")).toBe(DESIGN_TOKENS.callout.success);
    expect(recycleBinFeedbackCalloutClass("conflict")).toBe(DESIGN_TOKENS.callout.warn);
    expect(recycleBinFeedbackCalloutClass("error")).toBe(DESIGN_TOKENS.callout.blocked);
  });

  it("maps feedback kinds to StatusTag kinds", () => {
    expect(recycleBinFeedbackStatusKind("success")).toBe("ready");
    expect(recycleBinFeedbackStatusKind("conflict")).toBe("needs-attention");
    expect(recycleBinFeedbackStatusKind("error")).toBe("blocked");
  });
});
