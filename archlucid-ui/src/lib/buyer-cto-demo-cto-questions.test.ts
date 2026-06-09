import { describe, expect, it } from "vitest";

import { CTO_DEMO_QUESTIONS } from "@/lib/buyer-cto-demo-cto-questions";

describe("buyer-cto-demo-cto-questions", () => {
  it("defines six CTO diligence questions with proof links", () => {
    expect(CTO_DEMO_QUESTIONS).toHaveLength(6);

    for (const row of CTO_DEMO_QUESTIONS) {
      expect(row.question.length).toBeGreaterThan(10);
      expect(row.answer.length).toBeGreaterThan(20);
      expect(row.proofHref.startsWith("/")).toBe(true);
      expect(row.proofLabel.length).toBeGreaterThan(3);
    }
  });
});
