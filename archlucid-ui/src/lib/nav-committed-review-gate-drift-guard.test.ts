import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  NAV_COMMITTED_REVIEW_GATE_CONSUMER_RELATIVE_PATHS,
  findNavCommittedReviewGateConsumerViolations,
} from "@/lib/nav-committed-review-gate-source-patterns";

const REMEDIATION =
  "Nav gate consumers must call useEffectiveNavCommittedArchitectureReview() only (TB-2330). Sidebar, command palette, and impact-preview reachability must not read raw useNavCommittedArchitectureReview.";

describe("nav committed-review gate drift guard (TB-2330)", () => {
  it("requires gated nav consumers to use the effective hook only", () => {
    const offenders: string[] = [];

    for (const relativePath of NAV_COMMITTED_REVIEW_GATE_CONSUMER_RELATIVE_PATHS) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");
      const violations = findNavCommittedReviewGateConsumerViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${violations.join("; ")} — ${REMEDIATION}`);
      }
    }

    expect(offenders, REMEDIATION).toEqual([]);
  });
});
