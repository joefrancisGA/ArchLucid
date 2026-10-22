import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_ENTERPRISE_TABLE_ALLOWLIST } from "@/lib/operator/operator-enterprise-table-allowlist";
import {
  findOperatorEnterpriseTableGuardViolations,
  operatorEnterpriseTableModuleIsCompliant,
} from "@/lib/operator/operator-enterprise-table-patterns";

const SRC_ROOT = join(process.cwd(), "src");

function readModuleSource(modulePath: string): string {
  return readFileSync(join(SRC_ROOT, modulePath), "utf8");
}

const REMEDIATION =
  "Allowlisted operator inventories must use EnterpriseTable (TB-1646 / TB-1650); "
  + "entity-summary cards and raw HTML tables are not alternate inventory dialects.";

describe("operator enterprise-table guard (TB-1650)", () => {
  it("keeps a unique allowlist keyed by surface id", () => {
    const ids = OPERATOR_ENTERPRISE_TABLE_ALLOWLIST.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(8);
  });

  it("detects missing EnterpriseTable on allowlisted inventory modules", () => {
    const violations = findOperatorEnterpriseTableGuardViolations(
      '<div>{items.map((row) => <Card key={row.id}>{row.name}</Card>)}</div>',
    );

    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining(["missing-enterprise-table", "card-stack-inventory"]),
    );
  });

  it("allows compliant EnterpriseTable inventory modules", () => {
    const source = `
      import { EnterpriseTable, EnterpriseTableBody, EnterpriseTableRow } from "@/components/ui/enterprise-table";
      export function Example() {
        return (
          <EnterpriseTable ariaLabel="Example">
            <EnterpriseTableBody>
              {items.map((row) => (
                <EnterpriseTableRow key={row.id}>{row.name}</EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        );
      }
    `;

    expect(operatorEnterpriseTableModuleIsCompliant(source)).toBe(true);
  });

  it.each(
    OPERATOR_ENTERPRISE_TABLE_ALLOWLIST.map((entry) => [entry.id, entry.modulePath]),
  )("allowlisted surface %s stays on EnterpriseTable", (id, modulePath) => {
    const violations = findOperatorEnterpriseTableGuardViolations(readModuleSource(modulePath));

    expect(violations, `${id} (${modulePath}): ${REMEDIATION}`).toEqual([]);
  });
});
