"use client";

import { useEffect, useMemo, useState } from "react";

import type { PolicyPackContentValidationSummary } from "@/lib/api/policy-pack-validate-api";
import {
  partitionPolicyPackContentJsonIssues,
  type PolicyPackContentJsonValidationIssue,
  validatePolicyPackContentJson,
} from "@/lib/policy-pack-content-json-validation";

/** Debounce window before calling POST /v1/policy-packs/validate while typing. */
export const POLICY_PACK_CONTENT_JSON_VALIDATION_DEBOUNCE_MS = 450;

export type PolicyPackContentJsonValidationState = {
  readonly issues: readonly PolicyPackContentJsonValidationIssue[];
  readonly blockingIssues: readonly PolicyPackContentJsonValidationIssue[];
  readonly warnings: readonly PolicyPackContentJsonValidationIssue[];
  readonly valid: boolean;
  readonly validating: boolean;
  readonly validationReady: boolean;
  readonly validationUnavailable: boolean;
  readonly summary?: PolicyPackContentValidationSummary;
};

const idleValidState: PolicyPackContentJsonValidationState = {
  issues: [],
  blockingIssues: [],
  warnings: [],
  valid: true,
  validating: false,
  validationReady: true,
  validationUnavailable: false,
};

function buildState(
  issues: readonly PolicyPackContentJsonValidationIssue[],
  options: {
    readonly valid: boolean;
    readonly validating: boolean;
    readonly validationReady: boolean;
    readonly validationUnavailable: boolean;
    readonly summary?: PolicyPackContentValidationSummary;
  },
): PolicyPackContentJsonValidationState {
  const { blockingIssues, warnings } = partitionPolicyPackContentJsonIssues(issues);

  return {
    issues,
    blockingIssues,
    warnings,
    valid: options.valid,
    validating: options.validating,
    validationReady: options.validationReady,
    validationUnavailable: options.validationUnavailable,
    summary: options.summary,
  };
}

function tryParseJsonObject(jsonText: string): { readonly ok: true } | { readonly ok: false; readonly message: string } {
  const trimmed = jsonText.trim();

  if (trimmed.length === 0) {
    return { ok: true };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, message: "Expected a JSON object." };
    }

    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof SyntaxError ? error.message : "Invalid JSON";

    return { ok: false, message };
  }
}

/**
 * Debounced policy pack JSON linting via POST /v1/policy-packs/validate.
 * Syntax errors surface immediately; structural errors and rule-key warnings follow the debounced API call.
 */
export function usePolicyPackContentJsonValidation(jsonText: string): PolicyPackContentJsonValidationState {
  const [state, setState] = useState<PolicyPackContentJsonValidationState>(idleValidState);

  useEffect(() => {
    let cancelled = false;
    const trimmed = jsonText.trim();

    if (trimmed.length === 0) {
      setState(idleValidState);

      return;
    }

    const syntaxCheck = tryParseJsonObject(jsonText);

    if (!syntaxCheck.ok) {
      setState(
        buildState([{ kind: "syntax", message: syntaxCheck.message }], {
          valid: false,
          validating: false,
          validationReady: true,
          validationUnavailable: false,
        }),
      );

      return;
    }

    setState((previous) =>
      buildState(previous.issues, {
        valid: previous.valid,
        validating: true,
        validationReady: false,
        validationUnavailable: false,
        summary: previous.summary,
      }),
    );

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await validatePolicyPackContentJson(jsonText);

          if (cancelled) {
            return;
          }

          setState(
            buildState(result.issues, {
              valid: result.valid,
              validating: false,
              validationReady: true,
              validationUnavailable: false,
              summary: result.summary,
            }),
          );
        } catch {
          if (cancelled) {
            return;
          }

          setState(
            buildState([], {
              valid: false,
              validating: false,
              validationReady: false,
              validationUnavailable: true,
            }),
          );
        }
      })();
    }, POLICY_PACK_CONTENT_JSON_VALIDATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [jsonText]);

  return useMemo(() => state, [state]);
}
