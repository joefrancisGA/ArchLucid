/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_INVENTORY.md" as const;

export type CareerGravityCliApiDoorAwareness =
  | "explicit-rehearse"
  | "explicit-career"
  | "default-rehearsal"
  | "none"
  | "eval-ok"
  | "covered";

export type CareerGravityCliApiExecuteDoorRow = {
  readonly relativePath: string;
  readonly doorAwareness: CareerGravityCliApiDoorAwareness;
  readonly ownerPrompt: string;
};

export const CAREER_GRAVITY_CLI_TRY_COMMAND_PATH = "ArchLucid.Cli/Commands/TryCommand.cs" as const;

export const CAREER_GRAVITY_API_EXECUTE_PATH =
  "ArchLucid.Api/Controllers/Authority/RunsController.Execute.cs" as const;

export const CAREER_GRAVITY_CLI_API_EXECUTE_DOOR_ROWS: readonly CareerGravityCliApiExecuteDoorRow[] = [
  {
    relativePath: CAREER_GRAVITY_CLI_TRY_COMMAND_PATH,
    doorAwareness: "default-rehearsal",
    ownerPrompt: "CG-055",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/TryCommandOptions.cs",
    doorAwareness: "default-rehearsal",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/TryCommandExecutionDoor.cs",
    doorAwareness: "explicit-rehearse",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/RealModeSmokeCommand.cs",
    doorAwareness: "explicit-rehearse",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/RealModeSmoke/RealModeSmokeExecuteRunProbe.cs",
    doorAwareness: "explicit-career",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/ArchLucidCliApiClient.Runs.ExecuteCommit.cs",
    doorAwareness: "none",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/DraftNewCommandIntakeLoop.cs",
    doorAwareness: "none",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/SecondRunCommand.cs",
    doorAwareness: "none",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/GoldenCohortLockBaselineCommand.cs",
    doorAwareness: "eval-ok",
    ownerPrompt: "CG-005",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/GoldenCohortDriftCommand.cs",
    doorAwareness: "eval-ok",
    ownerPrompt: "CG-005",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/PilotProofPacketStructuralExecutionModeFormatter.cs",
    doorAwareness: "covered",
    ownerPrompt: "CG-045",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/FirstValueReportCommand.cs",
    doorAwareness: "none",
    ownerPrompt: "CG-027",
  },
  {
    relativePath: "ArchLucid.Cli/Commands/ProofPacketCommand.cs",
    doorAwareness: "covered",
    ownerPrompt: "CG-027",
  },
  {
    relativePath: CAREER_GRAVITY_API_EXECUTE_PATH,
    doorAwareness: "none",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Authority/RunsController.AsyncOperations.cs",
    doorAwareness: "none",
    ownerPrompt: "CG-054",
  },
  {
    relativePath: "ArchLucid.Api/Controllers/Authority/RunsController.CommitReplayPin.Commit.cs",
    doorAwareness: "none",
    ownerPrompt: "CG-021",
  },
  {
    relativePath: "ArchLucid.Contracts/Pilots/PilotTryRealModeHeaders.cs",
    doorAwareness: "explicit-career",
    ownerPrompt: "CG-054",
  },
] as const;
