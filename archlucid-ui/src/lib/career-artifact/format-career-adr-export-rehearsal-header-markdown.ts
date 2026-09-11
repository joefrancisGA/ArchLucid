import {
  resolvePackagePrintRehearsalHonestyStrip,
  type PackagePrintRehearsalHonestyStrip,
} from "@/lib/package-print-rehearsal-honesty";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

/** CG-024 — ADR export markdown header when execute stamp is not career-complete. */
export function resolveCareerAdrExportRehearsalHeader(
  input: {
    readonly workingDesk?: boolean;
    readonly isSample?: boolean | null;
    readonly structuralExecutionMode?: StructuralExecutionModeInput;
    readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
  },
): PackagePrintRehearsalHonestyStrip | null {
  return resolvePackagePrintRehearsalHonestyStrip(input);
}

export function formatCareerAdrExportRehearsalHeaderMarkdown(
  input: {
    readonly workingDesk?: boolean;
    readonly isSample?: boolean | null;
    readonly structuralExecutionMode?: StructuralExecutionModeInput;
    readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
  },
): string | null {
  const strip = resolveCareerAdrExportRehearsalHeader(input);

  if (strip === null) {
    return null;
  }

  return [
    `## ${strip.title}`,
    "",
    strip.body,
    "",
    `**${strip.modeNoticeTitle}** — ${strip.modeNoticeBody}`,
  ].join("\n");
}
