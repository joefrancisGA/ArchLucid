/** SN-036 — CLI clone/new-version honesty inventory (SN-008 / CG-062 / CG-021 / LW CAS). */

export const SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_OWNER = "SN-036" as const;

export const SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_COMMAND_PATH =
  "ArchLucid.Cli/Commands/DraftCloneSnapshotCommand.cs" as const;

export const SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_HONESTY_PATH =
  "ArchLucid.Cli/Commands/DraftCloneSnapshotHonesty.cs" as const;

export const SYSTEM_NOT_JOB_CLI_CLONE_SNAPSHOT_API_PATH =
  "ArchLucid.Cli/ArchLucidCliApiClient.Drafts.cs" as const;

export const SYSTEM_NOT_JOB_CLI_CLONE_HONESTY_LINES = {
  careerRehearsalRule: "Start-review stamps your Working Career or Rehearsal door on the new run (CG-062)",
  simulatorCareerBlock:
    "Record on Simulator host Mode cannot produce unlabeled sealed-record proof (CG-021)",
  casPatchReminder: "send ExpectedUpdatedUtc from the last GET/PATCH response (LW)",
} as const;
