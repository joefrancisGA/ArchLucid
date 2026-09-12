import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_LINES,
  SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_OWNER,
  SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_API_PATH,
  SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_COMMAND_PATH,
  SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_HONESTY_PATH,
} from "@/lib/system-not-job-cli-clone-honesty";

const REPO_ROOT = join(process.cwd(), "..");

describe("SN-036 CLI clone/new-version honesty", () => {
  it("documents command paths and honesty line inventory", () => {
    expect(SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_OWNER).toBe("SN-036");
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_COMMAND_PATH))).toBe(true);
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_HONESTY_PATH))).toBe(true);
    expect(existsSync(join(REPO_ROOT, SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_API_PATH))).toBe(true);
  });

  it("honesty module prints Career/Rehearsal and Simulator block rules on help and stdout", () => {
    const honesty = readFileSync(
      join(REPO_ROOT, SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_HONESTY_PATH),
      "utf8",
    );
    const command = readFileSync(
      join(REPO_ROOT, SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_COMMAND_PATH),
      "utf8",
    );

    expect(honesty).toContain(SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_LINES.careerRehearsalRule);
    expect(honesty).toContain(SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_LINES.simulatorCareerBlock);
    expect(honesty).toContain(SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_LINES.casPatchReminder);
    expect(honesty).toContain("WriteStdoutBannerAsync");
    expect(honesty).toContain("WriteHelp");
    expect(command).toContain("WriteStdoutBannerAsync");
    expect(command).not.toContain("PatchDraftAsync");
  });

  it("api client exposes clone-snapshot without request body fields", () => {
    const apiClient = readFileSync(join(REPO_ROOT, SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_API_PATH), "utf8");
    const handlers = readFileSync(join(REPO_ROOT, "ArchLucid.Cli/CliCommandHandlers.Misc.cs"), "utf8");
    const registry = readFileSync(join(REPO_ROOT, "ArchLucid.Cli/CommandRegistry.cs"), "utf8");

    expect(apiClient).toContain("CloneDraftSnapshotAsync");
    expect(apiClient).toContain("CloneSnapshotAsync");
    expect(handlers).toContain("clone-snapshot");
    expect(registry).toContain("draft clone-snapshot");
  });

  it("draft new patch path still sends ExpectedUpdatedUtc CAS token", () => {
    const admitStage = readFileSync(
      join(REPO_ROOT, "ArchLucid.Cli/Commands/DraftNewCommandAdmitStage.cs"),
      "utf8",
    );

    expect(admitStage).toContain("ExpectedUpdatedUtc = created.Value.UpdatedUtc");
  });
});
