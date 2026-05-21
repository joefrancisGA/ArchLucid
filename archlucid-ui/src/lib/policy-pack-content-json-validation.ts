import Ajv, { type ErrorObject, type ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

import { getPolicyPackContentDocumentJsonSchema } from "@/lib/api/policy-pack-content-schema-api";

export type PolicyPackContentJsonValidationIssue = {
  readonly kind: "syntax" | "schema";
  readonly message: string;
  readonly path?: string;
};

let validateContentDocument: ValidateFunction | null = null;
let loadValidatorPromise: Promise<ValidateFunction> | null = null;

async function loadValidator(): Promise<ValidateFunction> {
  if (validateContentDocument !== null) {
    return validateContentDocument;
  }

  if (loadValidatorPromise === null) {
    loadValidatorPromise = (async () => {
      const response = await getPolicyPackContentDocumentJsonSchema();
      const ajv = new Ajv({ allErrors: true, strict: false });
      addFormats(ajv);
      const compiled = ajv.compile(response.schema);
      validateContentDocument = compiled;
      return compiled;
    })();
  }

  return loadValidatorPromise;
}

function formatAjvError(error: ErrorObject): string {
  const path = error.instancePath.length > 0 ? error.instancePath : "/";
  const detail = error.message?.trim() ?? "does not match schema";

  return `${path}: ${detail}`;
}

/** Clears cached validator (for tests). */
export function resetPolicyPackContentJsonValidatorCacheForTests(): void {
  validateContentDocument = null;
  loadValidatorPromise = null;
}

/**
 * Validates policy pack content JSON against the server-exported schema.
 * Returns an empty list when the document is valid or the editor is empty.
 */
export async function validatePolicyPackContentJson(
  jsonText: string,
): Promise<PolicyPackContentJsonValidationIssue[]> {
  const trimmed = jsonText.trim();

  if (trimmed.length === 0) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (error: unknown) {
    const message = error instanceof SyntaxError ? error.message : "Invalid JSON";

    return [{ kind: "syntax", message }];
  }

  const validate = await loadValidator();

  if (validate(parsed)) {
    return [];
  }

  const errors = validate.errors ?? [];

  return errors.map((error) => ({
    kind: "schema" as const,
    message: formatAjvError(error),
    path: error.instancePath.length > 0 ? error.instancePath : undefined,
  }));
}
