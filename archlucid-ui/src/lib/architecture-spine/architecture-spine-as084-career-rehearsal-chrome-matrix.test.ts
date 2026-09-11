import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveEffectiveWorkingCareerRehearsalDoor,
  resolveWorkingCareerDoorGate,
} from "@/lib/governance/working-career-door-gate";
import { resolveWorkingCareerDoorHostModeMatrixCell } from "@/lib/governance/working-career-door-host-mode-matrix";
import {
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_DETAIL,
} from "@/lib/governance/working-career-door-host-mode-matrix-copy";
import {
  WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
} from "@/lib/governance/working-career-door-gate-copy";
import {
  presentDecisionGradeSemanticSupportBand,
  SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL,
} from "@/lib/governance/simulator-career-honesty";
import { shouldSuppressReadyToFinalizeForWorkingRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door";
import {
  resolveProductionDeskChrome,
  resolveProductionEvalChrome,
} from "@/lib/production-desk-chrome";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

const UI_ROOT = join(process.cwd());

const PRODUCTION_CHROME_INPUT = {
  staticDemoFallback: false,
  demoMarketingChrome: false,
  frictionlessTrial: false,
} as const;

const WORKING_CAREER_REHEARSAL_CHOOSER_RELATIVE_PATH =
  "src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";

type CareerRehearsalChromeMatrixCase = {
  readonly caseName: string;
  readonly run: () => void;
};

/** AS-084 / Career vs Rehearsal chrome matrix — cited by AS-100 wave close audit. */
const AS084_CAREER_REHEARSAL_CHROME_MATRIX_CASES: readonly CareerRehearsalChromeMatrixCase[] = [
  {
    caseName: "working_career_real_execute_allowed",
    run: () => {
      const deskInput = { workspaceMode: "working" as const, ...PRODUCTION_CHROME_INPUT };

      expect(resolveProductionDeskChrome(deskInput)).toBe(true);

      const gate = resolveWorkingCareerDoorGate({
        selectedDoor: "career",
        hostMode: "Real",
        sessionMode: "Real",
        isSessionReal: true,
        isLiveAiReady: true,
        isLoading: false,
      });

      expect(gate.isCareerExecuteBlocked).toBe(false);
      expect(resolveEffectiveWorkingCareerRehearsalDoor("career", gate)).toBe("career");
      expect(
        shouldSuppressReadyToFinalizeForWorkingRehearsalDoor({
          workingDesk: true,
          effectiveWorkingCareerRehearsalDoor: "career",
        }),
      ).toBe(false);
    },
  },
  {
    caseName: "working_career_no_real_blocked",
    run: () => {
      const gate = resolveWorkingCareerDoorGate({
        selectedDoor: "career",
        hostMode: "Simulator",
        sessionMode: "Simulator",
        isSessionReal: false,
        isLiveAiReady: false,
        isLoading: false,
      });

      expect(gate.isCareerExecuteBlocked).toBe(true);
      expect(gate.blockedDetail).toBe(WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL);
      expect(resolveEffectiveWorkingCareerRehearsalDoor("career", gate)).toBe("rehearsal");
    },
  },
  {
    caseName: "working_rehearsal_simulator_labeled",
    run: () => {
      expect(
        shouldSuppressReadyToFinalizeForWorkingRehearsalDoor({
          workingDesk: true,
          effectiveWorkingCareerRehearsalDoor: "rehearsal",
        }),
      ).toBe(true);

      const presentation = presentDecisionGradeSemanticSupportBand({
        wireBand: "Supported",
        structuralExecutionMode: StructuralExecutionModeWire.Simulator,
      });

      expect(presentation.isRehearsalPresentation).toBe(true);
      expect(presentation.label).toBe(SIMULATOR_SEMANTIC_SUPPORT_BAND_REHEARSAL_LABEL);
      expect(presentation.label).not.toBe("Supported");
    },
  },
  {
    caseName: "working_rehearsal_real_labeled_practice",
    run: () => {
      const gate = resolveWorkingCareerDoorGate({
        selectedDoor: "rehearsal",
        hostMode: "Real",
        sessionMode: "Real",
        isSessionReal: true,
        isLiveAiReady: true,
        isLoading: false,
      });
      const matrix = resolveWorkingCareerDoorHostModeMatrixCell({
        selectedDoor: "rehearsal",
        gate,
        isSessionReal: true,
        hostMode: "Real",
        sessionMode: "Real",
      });

      expect(matrix.cellId).toBe("rehearsal-real-practice");
      expect(matrix.labelAsRehearsal).toBe(true);
      expect(matrix.showStatusTag).toBe(true);
      expect(matrix.detail).toBe(WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_DETAIL);
      expect(resolveEffectiveWorkingCareerRehearsalDoor("rehearsal", gate)).toBe("rehearsal");
    },
  },
  {
    caseName: "guided_no_career_rehearsal_chooser",
    run: () => {
      const guidedInput = { workspaceMode: "guided" as const, ...PRODUCTION_CHROME_INPUT };

      expect(isWorkingWorkspaceMode("guided")).toBe(false);
      expect(resolveProductionDeskChrome(guidedInput)).toBe(false);
      expect(resolveProductionEvalChrome(guidedInput)).toBe(true);

      const chooserSource = readFileSync(
        join(UI_ROOT, WORKING_CAREER_REHEARSAL_CHOOSER_RELATIVE_PATH),
        "utf8",
      );

      expect(chooserSource).toContain("isWorkingWorkspaceMode(mode)");
      expect(chooserSource).toContain("return null");
    },
  },
];

describe("architecture spine AS-084 career vs Rehearsal chrome matrix (AS-100)", () => {
  it.each(AS084_CAREER_REHEARSAL_CHROME_MATRIX_CASES)("$caseName", ({ run }) => {
    run();
  });
});
