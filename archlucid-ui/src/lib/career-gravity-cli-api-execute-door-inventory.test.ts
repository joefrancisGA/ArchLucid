import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_API_EXECUTE_PATH,
  CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY_DOC_PATH,
  CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_ROWS,
  CAREER_GRAVITY_CLI_TRY_COMMAND_PATH,
} from "@/lib/career-gravity-cli-api-execute-door-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("career-gravity CLI/API execute-without-door inventory (CG-005)", () => {
  it("documents shrink-only inventory rows in repo markdown", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(markdown).toMatch(/ADR \*\*0091\*\*/);
    expect(markdown).toMatch(/UI doors do not bind curl/);
    expect(markdown).toMatch(/--rehearse/);
    expect(markdown).toMatch(/X-ArchLucid-Pilot-Try-Real-Mode/);
    expect(markdown).toMatch(/G-REAL-06/);

    for (const row of CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_ROWS) {
      expect(markdown).toContain("`" + row.relativePath + "`");
    }
  });

  it("lists only existing source files", () => {
    for (const row of CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_ROWS) {
      const path = join(REPO_ROOT, row.relativePath);

      expect(existsSync(path), row.relativePath).toBe(true);
    }
  });

  it("keeps try default Rehearsal and generic execute without a Career door header", () => {
    const tryCommand = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_CLI_TRY_COMMAND_PATH), "utf8");

    expect(tryCommand).toMatch(/Default is Rehearsal/);
    expect(tryCommand).toMatch(/--allow-simulator/);

    const execute = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_API_EXECUTE_PATH), "utf8");

    expect(execute).toMatch(/HttpPost\("review\/\{runId\}\/execute"\)/);
    expect(execute).toMatch(/HttpPost\("review\/\{runId\}\/execute\/selective"\)/);
    expect(execute).toMatch(/IsPilotTryRealModeRequest/);
    expect(execute).not.toMatch(/WorkingCareerRehearsal/);

    const client = readFileSync(
      join(REPO_ROOT, "ArchLucid.Cli/ArchLucidCliApiClient.Runs.ExecuteCommit.cs"),
      "utf8",
    );

    expect(client).toMatch(/ExecuteAsync\(runId, null/);
    expect(client).toMatch(/FinalizeAsync\(runId, null, null/);
  });
});
