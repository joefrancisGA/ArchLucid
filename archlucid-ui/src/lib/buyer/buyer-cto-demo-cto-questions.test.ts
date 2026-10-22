import { describe, expect, it } from "vitest";

import {
  CTO_DEMO_KNOWN_VALID_ROUTE_PREFIXES,
  CTO_DEMO_QUESTIONS,
} from "@/lib/buyer/buyer-cto-demo-cto-questions";

describe("buyer-cto-demo-cto-questions", () => {
  it("defines twelve CTO diligence questions with proof links", () => {
    expect(CTO_DEMO_QUESTIONS).toHaveLength(12);

    for (const row of CTO_DEMO_QUESTIONS) {
      expect(row.id.length).toBeGreaterThan(0);
      expect(row.question.length).toBeGreaterThan(10);
      expect(row.answer.length).toBeGreaterThan(20);
      expect(row.proofHref.startsWith("/")).toBe(true);
      expect(row.proofLabel.length).toBeGreaterThan(3);
    }
  });

  it("uses known route prefixes for every proof href", () => {
    for (const row of CTO_DEMO_QUESTIONS) {
      const matches = CTO_DEMO_KNOWN_VALID_ROUTE_PREFIXES.some((prefix) => row.proofHref.startsWith(prefix));

      expect(matches, `unexpected proof href for ${row.id}: ${row.proofHref}`).toBe(true);
    }
  });
});
