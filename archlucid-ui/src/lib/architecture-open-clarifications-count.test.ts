import { describe, expect, it } from "vitest";

import {
  countOpenClarifications,
  countOpenQuestionEntities,
} from "@/lib/architecture-open-clarifications-count";

const userAssertions = {
  architectureName: "Claims platform",
  architectureOverview: "User-entered overview about governed claims intake.",
  businessOutcome: "Reduce manual triage time.",
  peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
};

describe("architecture-open-clarifications-count (TB-1838)", () => {
  it("sums missing items and open-question entities", () => {
    expect(countOpenClarifications(3, 2)).toBe(5);
  });

  it("counts open-question bullets from generated architecture content", () => {
    const source = `## Open questions
- Who owns DR failover?
- What is the RPO target?`;

    expect(countOpenQuestionEntities(source, userAssertions)).toBe(2);
  });

  it("returns zero when the open-questions section is absent", () => {
    expect(countOpenQuestionEntities("## Executive summary\nNo questions here.", userAssertions)).toBe(0);
  });
});
