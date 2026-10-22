import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findHubPageContractViolations,
  HUB_PAGE_CONTRACT_DOC_SECTION,
  HUB_PAGE_DRIFT_GUARD_SOURCES,
  HUB_PAGE_FORBIDDEN_INTERNAL_HREF_PREFIXES,
} from "../src/lib/onboarding-hub-contract";

const UI_ROOT = process.cwd();
const REPO_ROOT = join(UI_ROOT, "..");

function readUiFile(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

describe("onboarding hub IA drift guard (TB-680)", () => {
  it("documents the hub-page contract in NAV_CONFIG_CONTRACT.md", () => {
    const navContract = readUiFile("docs/NAV_CONFIG_CONTRACT.md");

    expect(navContract).toContain(HUB_PAGE_CONTRACT_DOC_SECTION);
    expect(navContract).toContain("exactly one owning page");
    expect(navContract).toContain("onboarding-hub-contract.ts");
  });

  it("keeps known hub surfaces free of internal Operations hrefs and embedded wizards", () => {
    for (const relativePath of HUB_PAGE_DRIFT_GUARD_SOURCES) {
      const source = readUiFile(relativePath);
      const violations = findHubPageContractViolations(source);

      expect(violations, relativePath).toEqual([]);
    }
  });

  it("detects forbidden internal href prefixes", () => {
    const violations = findHubPageContractViolations('href="/internal/health"');

    expect(violations).toContainEqual({ kind: "forbidden-href", marker: "/internal/" });
  });

  it("detects embedded wizard markers", () => {
    const violations = findHubPageContractViolations("<FinishSetupWizardPanel />");

    expect(violations).toContainEqual({ kind: "forbidden-embed", marker: "FinishSetupWizardPanel" });
  });

  it("references buyer-safe health paths instead of diagnostics dashboard", () => {
    const optionalSetup = readUiFile("src/app/(operator)/architecture/first-review-guide/_sections/OptionalWorkspaceSetupList.tsx");

    expect(optionalSetup).toContain("FINISH_SETUP_SYSTEM_HEALTH_PATH");
    expect(optionalSetup).not.toContain("/internal/health");
    expect(HUB_PAGE_FORBIDDEN_INTERNAL_HREF_PREFIXES).toContain("/internal/");
  });

  it("keeps AGENTS.md linked to the hub contract", () => {
    const agents = readRepoFile("archlucid-ui/AGENTS.md");

    expect(agents).toContain("NAV_CONFIG_CONTRACT.md");
    expect(agents).toContain("Hub pages");
  });
});

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}
