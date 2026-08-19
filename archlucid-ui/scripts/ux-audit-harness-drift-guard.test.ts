import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  UX_AUDIT_EXPECTED_PNG_COUNTS,
  UX_AUDIT_MOCK_CHROMIUM_TEST_IGNORE_FRAGMENTS,
  UX_AUDIT_NPM_SCRIPTS,
  UX_AUDIT_OPERATOR_SHELL_CI_PROJECT,
  UX_AUDIT_OPERATOR_SHELL_CI_TEST_MATCH,
  UX_AUDIT_PLAYWRIGHT_PROJECT_NAMES,
  UX_AUDIT_SKILL_RELATIVE_PATH,
} from "../e2e/ux-audit-harness-contract";

const UI_ROOT = process.cwd();
const REPO_ROOT = join(UI_ROOT, "..");

function readUiFile(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

function projectBlock(source: string, projectName: string): string {
  const marker = `name: "${projectName}"`;
  const start = source.indexOf(marker);

  if (start < 0) {
    return "";
  }

  const nextProject = source.indexOf('name: "', start + marker.length);
  const end = nextProject < 0 ? source.length : nextProject;

  return source.slice(start, end);
}

describe("ux-audit harness drift guard (TB-653)", () => {
  const mockConfig = readUiFile("playwright.mock.config.ts");
  const operatorMockConfig = readUiFile("playwright.operator-mock.config.ts");
  const packageJson = readUiFile("package.json");
  const runnerScript = readUiFile("scripts/run-ux-audit.ps1");

  it("keeps duplicate-spec guards on the default mock chromium project", () => {
    const chromiumBlock = projectBlock(mockConfig, "chromium");

    for (const fragment of UX_AUDIT_MOCK_CHROMIUM_TEST_IGNORE_FRAGMENTS) {
      expect(chromiumBlock, `chromium testIgnore missing ${fragment}`).toContain(fragment);
    }
  });

  it("keeps dedicated UX audit Playwright projects and npm scripts wired", () => {
    for (const projectName of Object.values(UX_AUDIT_PLAYWRIGHT_PROJECT_NAMES)) {
      expect(mockConfig.includes(projectName) || operatorMockConfig.includes(projectName), projectName).toBe(true);
    }

    for (const scriptName of Object.values(UX_AUDIT_NPM_SCRIPTS)) {
      expect(packageJson, scriptName).toContain(`"${scriptName}"`);
    }

    expect(packageJson).toContain("./scripts/run-ux-audit.ps1");
  });

  it("does not couple merge-blocking operator-shell CI to the full UX audit spec", () => {
    const operatorShellBlock = projectBlock(operatorMockConfig, UX_AUDIT_OPERATOR_SHELL_CI_PROJECT);

    expect(operatorShellBlock).toContain(UX_AUDIT_OPERATOR_SHELL_CI_TEST_MATCH);
    expect(operatorShellBlock).not.toContain("ux-audit-screenshots.spec.ts");
  });

  it("keeps run-ux-audit.ps1 PNG validation aligned with the route registry", () => {
    expect(runnerScript).toContain(`$expectedBuyer = ${UX_AUDIT_EXPECTED_PNG_COUNTS.buyer}`);
    expect(runnerScript).toContain(`$expectedOperator = ${UX_AUDIT_EXPECTED_PNG_COUNTS.operator}`);
    expect(runnerScript).toContain(`$expectedMarketing = ${UX_AUDIT_EXPECTED_PNG_COUNTS.marketing}`);
  });

  it("keeps the lucid-ui-audit Cursor skill present for agent re-audits", () => {
    const skill = readRepoFile(UX_AUDIT_SKILL_RELATIVE_PATH);

    expect(skill).toContain("npm run ux-audit");
    expect(skill).toContain("run-ux-audit.ps1");
  });
});
