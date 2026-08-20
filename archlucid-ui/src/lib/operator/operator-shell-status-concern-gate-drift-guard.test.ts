import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_SHELL_STATUS_CONCERN_GATE_CONSUMER_RELATIVE_PATHS,
  findOperatorShellStatusConcernGateConsumerViolations,
} from "@/lib/operator/operator-shell-status-concern-gate-source-patterns";

const REMEDIATION =
  "Shell-status concern consumers must call useOperatorShellStatusConcernFetchEnabled() and wire concernFetchEnabled (or queryEnabled) into query enabled flags (TB-2304 performance).";

describe("operator shell-status concern gate drift guard (TB-2304 performance)", () => {
  it("requires inventoried concern consumers to use the gated hook", () => {
    const offenders: string[] = [];

    for (const relativePath of OPERATOR_SHELL_STATUS_CONCERN_GATE_CONSUMER_RELATIVE_PATHS) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");
      const violations = findOperatorShellStatusConcernGateConsumerViolations(source);

      if (violations.length > 0) {
        offenders.push(`${relativePath}: ${violations.join("; ")} — ${REMEDIATION}`);
      }
    }

    expect(offenders, REMEDIATION).toEqual([]);
  });
});
