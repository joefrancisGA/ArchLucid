import {
  validatePolicyPackContentDocument,
  type PolicyPackContentValidationIssue,
  type PolicyPackContentValidationSummary,
} from "@/lib/api/policy-pack-validate-api";
import { toApiLoadFailure } from "@/lib/api-load-failure";

export type PolicyPackContentJsonValidationIssueKind = "syntax" | "error" | "warning";

export type PolicyPackContentJsonValidationIssue = {
  readonly kind: PolicyPackContentJsonValidationIssueKind;
  readonly message: string;
  readonly path?: string;
};

export type PolicyPackContentJsonValidationResult = {
  readonly issues: readonly PolicyPackContentJsonValidationIssue[];
  readonly valid: boolean;
  readonly summary?: PolicyPackContentValidationSummary;
};

function mapApiIssue(issue: PolicyPackContentValidationIssue): PolicyPackContentJsonValidationIssue {
  const message = issue.message?.trim() ?? "Validation issue";
  const path = issue.path?.trim();

  if (issue.kind === "Warning") {
    return { kind: "warning", message, ...(path !== undefined && path.length > 0 ? { path } : {}) };
  }

  return { kind: "error", message, ...(path !== undefined && path.length > 0 ? { path } : {}) };
}

function syntaxIssue(message: string): PolicyPackContentJsonValidationResult {
  return {
    valid: false,
    issues: [{ kind: "syntax", message }],
  };
}

/**
 * Validates policy pack content JSON via POST /v1/policy-packs/validate.
 * Returns an empty issue list when the editor is empty.
 */
export async function validatePolicyPackContentJson(
  jsonText: string,
): Promise<PolicyPackContentJsonValidationResult> {
  const trimmed = jsonText.trim();

  if (trimmed.length === 0) {
    return { issues: [], valid: true };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (error: unknown) {
    const message = error instanceof SyntaxError ? error.message : "Invalid JSON";

    return syntaxIssue(message);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return syntaxIssue("Expected a JSON object.");
  }

  try {
    const response = await validatePolicyPackContentDocument(parsed);
    const issues = (response.issues ?? []).map(mapApiIssue);

    return {
      valid: response.valid === true,
      summary: response.summary,
      issues,
    };
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    return {
      valid: false,
      issues: [{ kind: "error", message: failure.message }],
    };
  }
}

export function partitionPolicyPackContentJsonIssues(
  issues: readonly PolicyPackContentJsonValidationIssue[],
): {
  readonly blockingIssues: PolicyPackContentJsonValidationIssue[];
  readonly warnings: PolicyPackContentJsonValidationIssue[];
} {
  const blockingIssues = issues.filter((issue) => issue.kind === "syntax" || issue.kind === "error");
  const warnings = issues.filter((issue) => issue.kind === "warning");

  return { blockingIssues, warnings };
}
