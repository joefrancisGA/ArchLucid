import {
  extractScopeUnderstandingLinesFromBrief,
  SCOPE_UNDERSTANDING_SECTION_HEADER,
} from "@/lib/architecture/architecture-scope-understanding-check";
import { GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL } from "@/lib/guided-intake-copy";
import { extractAttachedIntakeFileNames } from "@/lib/intake-attached-file-names";
import {
  extractGeneratedIntakeBriefTitle,
  isGeneratedIntakeBrief,
} from "@/lib/review-display-title";

const BUSINESS_OUTCOME_MARKER = "\n\nBusiness outcome: ";

const GENERATED_BRIEF_EVALUATION_DIRECTIVE_PATTERN =
  /Evaluate the attached materials for [^.]+\./;

const MAX_RECAP_FIELD_VALUE_CHARS = 400;

export type ReviewSubmittedIntakeRecapField = {
  readonly label: string;
  readonly value: string;
};

export type ReviewSubmittedIntakeRecap = {
  readonly fields: readonly ReviewSubmittedIntakeRecapField[];
  readonly attachedFiles: readonly string[];
};

export type DeriveReviewSubmittedIntakeRecapInput = {
  readonly description: string | null | undefined;
  readonly systemName?: string | null;
};

function truncateRecapValue(text: string): string {
  if (text.length <= MAX_RECAP_FIELD_VALUE_CHARS) {
    return text;
  }

  return `${text.slice(0, MAX_RECAP_FIELD_VALUE_CHARS - 1).trimEnd()}…`;
}

function briefBodyWithoutScopeSection(description: string): string {
  const sectionIndex = description.indexOf(SCOPE_UNDERSTANDING_SECTION_HEADER);

  if (sectionIndex < 0) {
    return description;
  }

  return description.slice(0, sectionIndex).trimEnd();
}

function pushUniqueRecapField(
  fields: ReviewSubmittedIntakeRecapField[],
  field: ReviewSubmittedIntakeRecapField,
): void {
  const normalizedValue = field.value.trim().toLowerCase();

  if (normalizedValue.length === 0) {
    return;
  }

  const duplicateValue = fields.some(
    (existing) => existing.value.trim().toLowerCase() === normalizedValue,
  );

  if (duplicateValue) {
    return;
  }

  fields.push(field);
}

function pushScopeLineFields(
  fields: ReviewSubmittedIntakeRecapField[],
  scopeLines: readonly string[],
): void {
  for (const line of scopeLines) {
    const colonIndex = line.indexOf(":");

    if (colonIndex >= 0) {
      pushUniqueRecapField(fields, {
        label: line.slice(0, colonIndex).trim(),
        value: line.slice(colonIndex + 1).trim(),
      });

      continue;
    }

    pushUniqueRecapField(fields, { label: "In-scope item", value: line.trim() });
  }
}

/**
 * Read-only recap of the intake package already persisted on a review record.
 * Used when execution fails before processing so operators can verify what was submitted.
 */
export function deriveReviewSubmittedIntakeRecap(
  input: DeriveReviewSubmittedIntakeRecapInput,
): ReviewSubmittedIntakeRecap | null {
  const description = (input.description ?? "").trim();

  if (description.length === 0) {
    return null;
  }

  const attachedFiles = extractAttachedIntakeFileNames(description);
  const scopeLines = extractScopeUnderstandingLinesFromBrief(description);
  const fields: ReviewSubmittedIntakeRecapField[] = [];

  const title =
    extractGeneratedIntakeBriefTitle(description) ?? (input.systemName?.trim() || null);

  if (title !== null && title.length > 0) {
    pushUniqueRecapField(fields, { label: "Review title", value: title });
  }

  if (isGeneratedIntakeBrief(description)) {
    const directiveMatch = GENERATED_BRIEF_EVALUATION_DIRECTIVE_PATTERN.exec(description);

    if (directiveMatch !== null) {
      pushUniqueRecapField(fields, { label: "Evaluation directive", value: directiveMatch[0] });
    }
  } else {
    const briefBody = briefBodyWithoutScopeSection(description).trim();

    if (briefBody.length > 0 && briefBody !== title) {
      pushUniqueRecapField(fields, { label: "Architecture brief", value: truncateRecapValue(briefBody) });
    }
  }

  const businessOutcomeIndex = description.indexOf(BUSINESS_OUTCOME_MARKER);

  if (businessOutcomeIndex >= 0) {
    const outcome = description
      .slice(businessOutcomeIndex + BUSINESS_OUTCOME_MARKER.length)
      .split("\n\n")[0]
      ?.trim();

    if (outcome !== undefined && outcome.length > 0) {
      pushUniqueRecapField(fields, {
        label: GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
        value: outcome,
      });
    }
  }

  pushScopeLineFields(fields, scopeLines);

  if (fields.length === 0 && attachedFiles.length === 0) {
    return null;
  }

  return { fields, attachedFiles };
}
