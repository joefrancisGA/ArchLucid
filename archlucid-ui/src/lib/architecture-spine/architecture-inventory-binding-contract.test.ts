import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

export const ARCHITECTURE_INVENTORY_BINDING_CONTRACT_RELATIVE_PATH =
  "docs/library/ARCHITECTURE_INVENTORY_BINDING_CONTRACT.md";

describe("architecture inventory binding contract (AS-046)", () => {
  it("contract file exists, documents optional bind, and forbids second ARM collector", () => {
    const contractPath = join(REPO_ROOT, ARCHITECTURE_INVENTORY_BINDING_CONTRACT_RELATIVE_PATH);

    expect(existsSync(contractPath), ARCHITECTURE_INVENTORY_BINDING_CONTRACT_RELATIVE_PATH).toBe(true);

    const contract = readFileSync(contractPath, "utf8");

    expect(contract).toMatch(/ArchitectureInventoryBinding/i);
    expect(contract).toMatch(/AzureInventorySnapshot/i);
    expect(contract).toMatch(/ObservedFact/i);
    expect(contract).toMatch(/Get-ArchLucidAzurePackage\.ps1/i);
    expect(contract).toMatch(/HostedAzureExtractorClient/i);
    expect(contract).toMatch(/second Azure collector|no second collector|One collector family/i);
    expect(contract).toMatch(/estate gap/i);
    expect(contract).toMatch(/three finding streams/i);
  });
});
