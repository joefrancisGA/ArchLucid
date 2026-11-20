import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round72 mounted contract", () => {
  it("working standards, factory queue error, patterns filter, sealed date range", () => {
    expect(readUiSource("app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionPageView.tsx")).toContain(
      "StandardsRulesWorkingRulesSection",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactoryPriorityQueueLoadFailurePartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-patterns/RemediationPatternsClient.tsx")).toContain(
      "RemediationPatternsFilterEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/sealed-records/_sections/SignedRecordsListEmptyStates.tsx")).toContain(
      "SignedRecordsDateRangeFilterEmptyPartialHonesty",
    );
  });
});