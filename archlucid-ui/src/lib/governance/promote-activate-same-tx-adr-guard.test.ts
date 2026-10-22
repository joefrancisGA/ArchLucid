import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PROMOTE_ACTIVATE_SAME_TX_ADR_0083_ACCEPTED_STATUSES,
  PROMOTE_ACTIVATE_SAME_TX_ADR_0083_RELATIVE_PATH,
} from "@/lib/governance/promote-activate-same-tx-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("promote-activate-submit same-tx ADR guard (LP-08 / ADR 0083)", () => {
  it("ADR 0083 exists with Proposed or Accepted status and names submit promote activate co-commit", () => {
    const adrPath = join(REPO_ROOT, PROMOTE_ACTIVATE_SAME_TX_ADR_0083_RELATIVE_PATH);

    expect(existsSync(adrPath), PROMOTE_ACTIVATE_SAME_TX_ADR_0083_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/promote.*activate.*submit/i);
    expect(adr).toMatch(/GovernanceManifestPromoted/i);
    expect(adr).toMatch(/GovernanceEnvironmentActivated/i);
    expect(adr).toMatch(/GovernanceApprovalSubmitted/i);
    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0083 must declare Proposed or Accepted status").not.toBeNull();
    expect(PROMOTE_ACTIVATE_SAME_TX_ADR_0083_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/TB-956/i);
    expect(adr).toMatch(/co-commit/i);
  });
});
