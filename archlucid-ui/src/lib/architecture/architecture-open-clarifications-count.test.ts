import { describe, expect, it } from "vitest";

import {
  countClarificationGaps,
  countOpenClarifications,
  countOpenQuestionEntities,
} from "@/lib/architecture/architecture-open-clarifications-count";
import type { ArchitectureMissingItem } from "@/lib/architecture/architecture-created-home-model";

const clarificationItems: ArchitectureMissingItem[] = [
  {
    id: "business-outcome",
    label: "Business outcome is still brief or missing",
    href: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
    category: "clarification",
    source: { label: "From your brief", capturedAtLabel: null },
  },
  {
    id: "diagram",
    label: "Architecture diagram or supporting evidence not uploaded",
    href: "/architecture/reviews/run-1?archTab=evidence",
    category: "evidence",
    source: { label: "From your brief", capturedAtLabel: null },
  },
];

describe("architecture-open-clarifications-count (TB-1838)", () => {
  it("sums clarification gaps and open-question entities only", () => {
    expect(countOpenClarifications(countClarificationGaps(clarificationItems), 2)).toBe(3);
  });

  it("ignores evidence and assessment categories in clarification gap count", () => {
    expect(countClarificationGaps(clarificationItems)).toBe(1);
  });

  it("counts open-question bullets from generated architecture content", () => {
    const userAssertions = {
      architectureName: "Claims platform",
      architectureOverview: "User-entered overview about governed claims intake.",
      businessOutcome: "Reduce manual triage time.",
      peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
    };
    const source = `## Open questions
- Who owns DR failover?
- What is the RPO target?`;

    expect(countOpenQuestionEntities(source, userAssertions)).toBe(2);
  });

  it("returns zero when the open-questions section is absent", () => {
    const userAssertions = {
      architectureName: "Claims platform",
      architectureOverview: "User-entered overview about governed claims intake.",
      businessOutcome: "Reduce manual triage time.",
      peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
    };

    expect(countOpenQuestionEntities("## Sponsor report\nNo questions here.", userAssertions)).toBe(0);
  });
});
