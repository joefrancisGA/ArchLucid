"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type PolicyPackContentJsonValidationIssue,
  validatePolicyPackContentJson,
} from "@/lib/policy-pack-content-json-validation";

type ValidationState = {
  readonly issues: PolicyPackContentJsonValidationIssue[];
  readonly schemaReady: boolean;
  readonly schemaLoadFailed: boolean;
};

const emptyValidState: ValidationState = {
  issues: [],
  schemaReady: false,
  schemaLoadFailed: false,
};

/**
 * Real-time policy pack JSON linting against GET /v1/governance/policy-pack-content-schema.
 */
export function usePolicyPackContentJsonValidation(jsonText: string): ValidationState {
  const [schemaReady, setSchemaReady] = useState(false);
  const [schemaLoadFailed, setSchemaLoadFailed] = useState(false);
  const [issues, setIssues] = useState<PolicyPackContentJsonValidationIssue[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextIssues = await validatePolicyPackContentJson(jsonText);

        if (!cancelled) {
          setIssues(nextIssues);
          setSchemaReady(true);
          setSchemaLoadFailed(false);
        }
      } catch {
        if (!cancelled) {
          setSchemaLoadFailed(true);
          setIssues([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jsonText]);

  return useMemo(
    () =>
      schemaLoadFailed
        ? { ...emptyValidState, schemaLoadFailed: true }
        : { issues, schemaReady, schemaLoadFailed: false },
    [issues, schemaReady, schemaLoadFailed],
  );
}
