import { describe, expect, it } from "vitest";

import {
  formatRemediationPriorityReaderSentence,
  REMEDIATION_PRIORITY_BREAKDOWN_NOT_STORED,
  REMEDIATION_PRIORITY_NO_LEADING_FACTOR,
} from "@/lib/remediation-priority-reader-sentence";

describe("formatRemediationPriorityReaderSentence", () => {
  it("names the two strongest recorded factors", () => {
    const breakdown = JSON.stringify([
      { Factor: "InternetExposure", NormalizedValue: 1, WeightedContribution: 0.1, Source: "public" },
      { Factor: "DataSensitivity", NormalizedValue: 0.8, WeightedContribution: 0.08, Source: "customer" },
      { Factor: "Severity", NormalizedValue: 0, WeightedContribution: 0, Source: "unknown" },
    ]);

    expect(formatRemediationPriorityReaderSentence(breakdown)).toBe(
      "Reachable from the internet. Sensitive data.",
    );
  });

  it("reads numeric enum values from the stored breakdown", () => {
    const breakdown = JSON.stringify([
      { factor: 3, normalizedValue: 1, weightedContribution: 0.1, source: "internet" },
      { factor: 8, normalizedValue: 1, weightedContribution: -0.05, source: "active-exception" },
    ]);

    expect(formatRemediationPriorityReaderSentence(breakdown)).toBe(
      "Reachable from the internet. An exception is already in force.",
    );
  });

  it("keeps the earlier factor when two contributions tie", () => {
    const breakdown = JSON.stringify([
      { Factor: "Severity", NormalizedValue: 1, WeightedContribution: 0.1, Source: "high" },
      { Factor: "BlastRadius", NormalizedValue: 1, WeightedContribution: 0.1, Source: "wide" },
    ]);

    expect(formatRemediationPriorityReaderSentence(breakdown)).toBe("High severity. Wide blast radius.");
  });

  it("says when the breakdown does not name a leading factor", () => {
    expect(formatRemediationPriorityReaderSentence("[]")).toBe(REMEDIATION_PRIORITY_NO_LEADING_FACTOR);
    expect(formatRemediationPriorityReaderSentence("")).toBe(REMEDIATION_PRIORITY_BREAKDOWN_NOT_STORED);
    expect(formatRemediationPriorityReaderSentence("not-json")).toBe(REMEDIATION_PRIORITY_BREAKDOWN_NOT_STORED);
    expect(
      formatRemediationPriorityReaderSentence(
        JSON.stringify([{ Factor: "Severity", NormalizedValue: 0.5, WeightedContribution: 0.1, Source: "unknown" }]),
      ),
    ).toBe(REMEDIATION_PRIORITY_NO_LEADING_FACTOR);
  });

  it("distinguishes missing rollback metadata from a recorded none rollback", () => {
    const noneRollback = JSON.stringify([
      { Factor: "RemediationRisk", NormalizedValue: 1, WeightedContribution: 0.1, Source: "none" },
    ]);
    const missingRollback = JSON.stringify([
      { Factor: "RemediationRisk", NormalizedValue: 1, WeightedContribution: 0.1, Source: "unknown" },
    ]);

    expect(formatRemediationPriorityReaderSentence(noneRollback)).toBe("No rollback recorded.");
    expect(formatRemediationPriorityReaderSentence(missingRollback)).toBe("Rollback plan was not stored.");
  });

  it("does not put a decimal or a percent sign in the sentence", () => {
    const breakdown = JSON.stringify([
      { Factor: "Exploitability", NormalizedValue: 0.42, WeightedContribution: 0.42, Source: "practical" },
    ]);
    const sentence = formatRemediationPriorityReaderSentence(breakdown);

    expect(sentence).toBe("Practical to exploit.");
    expect(sentence).not.toMatch(/\d/);
    expect(sentence).not.toContain("%");
  });
});
