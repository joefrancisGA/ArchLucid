import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DESK_IA_ADR_0095_ACCEPTED_STATUSES,
  DESK_IA_ADR_0095_RELATIVE_PATH,
  DESK_IA_SIGNED_RECORDS_LIST_PATH,
} from "@/lib/desk-ia-adr-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("desk-ia ADR guard (DI-001 / ADR 0095)", () => {
  it("ADR 0095 exists, names Governance inventory home, and forbids tab collapse", () => {
    const adrPath = join(REPO_ROOT, DESK_IA_ADR_0095_RELATIVE_PATH);

    expect(existsSync(adrPath), DESK_IA_ADR_0095_RELATIVE_PATH).toBe(true);

    const adr = readFileSync(adrPath, "utf8");

    expect(adr).toMatch(/## Trade-offs/);
    expect(adr).toMatch(/## Constraints/);
    expect(adr).toMatch(/## Expected impact/);

    const statusMatch = adr.match(/\*\*Status:\*\*\s*(Proposed|Accepted)/);

    expect(statusMatch, "ADR 0095 must declare Proposed or Accepted status").not.toBeNull();
    expect(DESK_IA_ADR_0095_ACCEPTED_STATUSES).toContain(statusMatch![1]);

    expect(adr).toMatch(/Governance/i);
    expect(adr).toMatch(/sealed review records/i);
    expect(adr).toMatch(/Do not.*hide desktop review workspace tabs behind \*\*More\*\*/i);
    expect(adr).toMatch(/security/i);
    expect(adr).toMatch(/G-REAL-06/);
  });

  it("canonical list path matches signed-records route module", () => {
    const pathsModule = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/signed-records-paths.ts"),
      "utf8",
    );

    expect(pathsModule).toContain(DESK_IA_SIGNED_RECORDS_LIST_PATH);
  });
});
