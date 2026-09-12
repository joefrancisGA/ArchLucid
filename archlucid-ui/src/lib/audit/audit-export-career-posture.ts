import { resolveCareerArtifactExportHonestyDoorFields } from "@/lib/career-artifact/resolve-career-artifact-export-honesty-input";
import { evaluateCareerArtifactHonesty } from "@/lib/career-artifact/career-artifact-honesty";
import { AUDIT_DUAL_CHANNEL_HONESTY_NOTE } from "@/lib/buyer-copy/audit";
import { isRehearsalStructuralExecutionMode } from "@/lib/governance/simulator-career-honesty";
import {
  normalizeStructuralExecutionModeWire,
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import type { RunSummary } from "@/types/authority";

/** CG-026 — posture metadata for run-scoped audit CSV exports. */
export type AuditExportCareerPosture = {
  readonly structuralExecutionMode: string;
  readonly workingCareerRehearsalDoor: WorkingCareerRehearsalDoorId;
  readonly rehearsalIncomplete: boolean;
};

export function resolveAuditExportCareerPosture(input: {
  readonly progressSummary?: RunSummary | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
}): AuditExportCareerPosture {
  const resolved = resolveCareerArtifactExportHonestyDoorFields(input);
  const structuralExecutionMode =
    normalizeStructuralExecutionModeWire(resolved.structuralExecutionMode ?? null)
    ?? StructuralExecutionModeWire.Simulator;
  const workingCareerRehearsalDoor = resolved.effectiveWorkingCareerRehearsalDoor;
  const rehearsalIncomplete =
    isRehearsalStructuralExecutionMode(structuralExecutionMode)
    && workingCareerRehearsalDoor === "rehearsal";

  return {
    structuralExecutionMode,
    workingCareerRehearsalDoor,
    rehearsalIncomplete,
  };
}

export function resolveAuditExportCareerBlockedReason(input: {
  readonly runId: string;
  readonly progressSummary?: RunSummary | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
  readonly enginesSucceeded?: number | null;
}): string | null {
  const trimmedRunId = input.runId.trim();

  if (trimmedRunId.length === 0) {
    return null;
  }

  const resolved = resolveCareerArtifactExportHonestyDoorFields(input);
  const verdict = evaluateCareerArtifactHonesty({
    runId: trimmedRunId,
    artifactKind: "export",
    progressSummary: input.progressSummary ?? null,
    manifestSummary: null,
    graphSnapshot: null,
    structuralExecutionMode: resolved.structuralExecutionMode,
    effectiveWorkingCareerRehearsalDoor: resolved.effectiveWorkingCareerRehearsalDoor,
    enginesSucceeded: input.enginesSucceeded ?? null,
    preCommitGateEnabled: true,
    workingDesk: true,
    transparencyTrail: {
      asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
      inferred: [],
      skipped: [],
    },
  });

  if (verdict.canRender) {
    return null;
  }

  return verdict.blockedReasons[0] ?? "Audit CSV export is blocked by career artifact honesty gates.";
}

export function buildAuditExportCsvHonestyPreambleLines(
  posture: AuditExportCareerPosture | null,
): readonly string[] {
  const dualChannelLines = [
    "# dualChannelHonesty=durableSqlLedgerOnly",
    `# dualChannelNote=${AUDIT_DUAL_CHANNEL_HONESTY_NOTE.replace(/\r?\n/g, " ")}`,
  ];

  if (posture === null) {
    return [
      "# ArchLucid audit CSV export posture (CG-026)",
      "# Run-scoped posture stamps apply when runId query filter is set.",
      ...dualChannelLines,
    ];
  }

  return [
    "# ArchLucid audit CSV export posture (CG-026)",
    `# structuralExecutionMode=${posture.structuralExecutionMode}`,
    `# workingCareerRehearsalDoor=${posture.workingCareerRehearsalDoor}`,
    `# rehearsalIncomplete=${posture.rehearsalIncomplete ? "True" : "False"}`,
    ...dualChannelLines,
  ];
}
