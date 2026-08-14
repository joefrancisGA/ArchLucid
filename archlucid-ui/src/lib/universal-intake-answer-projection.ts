import { CLOUD_TARGET_QUESTION_KEY } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL } from "@/lib/architecture/architecture-draft-structured-brief";
import type { CreateArchitectureRunRequestPayload } from "@/lib/api/architecture-runs";
import {
  encodeQuickStartPendingEvidenceFileNames,
  QUICK_START_INTAKE_LIMITED_EVIDENCE_ANALYSIS_ACK_KEY,
  QUICK_START_INTAKE_OPERATOR_BRIEF_CHARACTER_COUNT_KEY,
  QUICK_START_INTAKE_PENDING_EVIDENCE_FILE_NAMES_KEY,
  QUICK_START_LIMITED_EVIDENCE_ANALYSIS_ACK_VALUE,
} from "@/lib/quick-start-intake-metadata-keys";
import { UNIVERSAL_INTAKE_MUST_QUESTION_KEYS } from "@/lib/universal-intake-must-completeness";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

const INLINE_REQUIREMENT_LABELS: Readonly<Record<string, string>> = {
  "l0.actor.additional-kinds": "Additional actor kinds",
  "l0.pillar.reliability": "Reliability",
  "l0.pillar.operations": "Operations",
  "l0.pillar.performance": "Performance",
};

const CONSTRAINT_LABELS: Readonly<Record<string, string>> = {
  "l0.pillar.security": "Security posture",
  "l0.pillar.cost": "Cost",
};

function resolveEffectiveAnswer(
  answers: Readonly<Record<string, string>>,
  skippedQuestionKeys: ReadonlySet<string>,
  questionKey: string,
): string | null {
  const trimmedAnswer = answers[questionKey]?.trim() ?? "";

  if (trimmedAnswer.length > 0) {
    return trimmedAnswer;
  }

  if (skippedQuestionKeys.has(questionKey)) {
    return ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL;
  }

  return null;
}

function appendUnique(target: string[], line: string): void {
  if (target.some((existing) => existing === line)) {
    return;
  }

  target.push(line);
}

export function projectUniversalIntakeAnswersOntoCreateRunPayload(
  basePayload: CreateArchitectureRunRequestPayload,
  answers: Readonly<Record<string, string>>,
  skippedQuestionKeys: ReadonlySet<string>,
  intakeTransparencyTrail: TransparencyTrail,
  options?: {
    readonly pendingEvidenceFileNames?: readonly string[];
    readonly limitedEvidenceAnalysisAcknowledged?: boolean;
    readonly operatorBriefCharacterCount?: number;
  },
): CreateArchitectureRunRequestPayload {
  const constraints = [...basePayload.constraints];
  const inlineRequirements = [...(basePayload.inlineRequirements ?? [])];
  let cloudProvider = basePayload.cloudProvider;

  for (const questionKey of UNIVERSAL_INTAKE_MUST_QUESTION_KEYS) {
    const effectiveAnswer = resolveEffectiveAnswer(answers, skippedQuestionKeys, questionKey);

    if (effectiveAnswer === null) {
      continue;
    }

    if (questionKey === CLOUD_TARGET_QUESTION_KEY) {
      if (effectiveAnswer === ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL) {
        cloudProvider = "None";
      } else if (effectiveAnswer === "Azure" || effectiveAnswer === "Aws" || effectiveAnswer === "Gcp") {
        cloudProvider = effectiveAnswer;
      } else if (effectiveAnswer === "None") {
        cloudProvider = "None";
      }

      continue;
    }

    const inlineLabel = INLINE_REQUIREMENT_LABELS[questionKey];
    const constraintLabel = CONSTRAINT_LABELS[questionKey];
    const line =
      inlineLabel !== undefined
        ? `${inlineLabel}: ${effectiveAnswer}`
        : constraintLabel !== undefined
          ? `${constraintLabel}: ${effectiveAnswer}`
          : effectiveAnswer;

    if (constraintLabel !== undefined) {
      appendUnique(constraints, line);

      continue;
    }

    if (inlineLabel !== undefined) {
      appendUnique(inlineRequirements, line);
    }
  }

  return {
    ...basePayload,
    cloudProvider,
    constraints,
    inlineRequirements,
    intakeQuestionAnswers: {
      ...Object.fromEntries(
        UNIVERSAL_INTAKE_MUST_QUESTION_KEYS.flatMap((questionKey) => {
          const effectiveAnswer = resolveEffectiveAnswer(answers, skippedQuestionKeys, questionKey);

          if (effectiveAnswer === null) {
            return [];
          }

          return [[questionKey, effectiveAnswer]];
        }),
      ),
      ...(options?.pendingEvidenceFileNames !== undefined && options.pendingEvidenceFileNames.length > 0
        ? {
            [QUICK_START_INTAKE_PENDING_EVIDENCE_FILE_NAMES_KEY]: encodeQuickStartPendingEvidenceFileNames(
              options.pendingEvidenceFileNames,
            ),
          }
        : {}),
      ...(options?.limitedEvidenceAnalysisAcknowledged === true
        ? {
            [QUICK_START_INTAKE_LIMITED_EVIDENCE_ANALYSIS_ACK_KEY]: QUICK_START_LIMITED_EVIDENCE_ANALYSIS_ACK_VALUE,
          }
        : {}),
      ...(options?.operatorBriefCharacterCount !== undefined
        ? {
            [QUICK_START_INTAKE_OPERATOR_BRIEF_CHARACTER_COUNT_KEY]: String(options.operatorBriefCharacterCount),
          }
        : {}),
    },
    intakeTransparencyTrail,
    requestSource: "wizard",
    wizardPresetUsed: "quick-review",
  };
}
