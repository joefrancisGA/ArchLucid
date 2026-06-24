"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { validatePolicyPackContentDocument } from "@/lib/api/policy-pack-validate-api";
import type { PolicyPackContentValidationResponse } from "@/lib/api/policy-pack-validate-api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { cn } from "@/lib/utils";

type ValidationResponse = PolicyPackContentValidationResponse;

const SAMPLE_DOCUMENT = `{
  "complianceRuleIds": [],
  "complianceRuleKeys": ["network-must-have-security-baseline"],
  "alertRuleIds": [],
  "compositeAlertRuleIds": [],
  "advisoryDefaults": {},
  "metadata": {}
}`;

function formatSummary(summary: ValidationResponse["summary"]): string {
  if (summary === undefined || summary === null) {
    return "";
  }

  const ruleCount = (summary.complianceRuleIdCount ?? 0) + (summary.complianceRuleKeyCount ?? 0);

  return `Valid pack: ${ruleCount} compliance rules, ${summary.alertRuleIdCount ?? 0} alert rules, ${summary.advisoryDefaultCount ?? 0} advisory defaults, ${summary.elicitationQuestionCount ?? 0} elicitation questions.`;
}

export function PolicyPackJsonValidatorPanel() {
  const [jsonText, setJsonText] = useState<string>(SAMPLE_DOCUMENT);
  const [busy, setBusy] = useState<boolean>(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [result, setResult] = useState<ValidationResponse | null>(null);

  const onValidate = useCallback(async () => {
    setBusy(true);
    setFailure(null);
    setResult(null);

    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonText) as unknown;
    } catch (error: unknown) {
      const message = error instanceof SyntaxError ? error.message : "Invalid JSON";

      setFailure(uiFailureFromMessage(`JSON syntax error: ${message}`));
      setBusy(false);

      return;
    }

    try {
      const response = await validatePolicyPackContentDocument(parsed);
      setResult(response);
    } catch (error: unknown) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setBusy(false);
    }
  }, [jsonText]);

  const errors = (result?.issues ?? []).filter((issue) => issue.kind === "Error");
  const warnings = (result?.issues ?? []).filter((issue) => issue.kind === "Warning");

  return (
    <section
      className="space-y-4 rounded-md border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-700"
      data-testid="policy-pack-json-validator-panel"
    >
      <div className="space-y-1">
        <h3 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Validate JSON</h3>
        <p className="m-0 max-w-prose text-xs text-neutral-700 dark:text-neutral-300">
          Paste a <code className="font-mono">PolicyPackContentDocument</code> to check schema shape and unknown{" "}
          <code className="font-mono">complianceRuleKeys</code> before create or publish.
        </p>
      </div>

      <Textarea
        value={jsonText}
        onChange={(event) => {
          setJsonText(event.target.value);
        }}
        rows={14}
        className="font-mono text-xs"
        aria-label="Policy pack content JSON to validate"
        data-testid="policy-pack-json-validator-input"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => void onValidate()} disabled={busy} data-testid="policy-pack-json-validator-run">
          {busy ? "Validating…" : "Validate JSON"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setJsonText(SAMPLE_DOCUMENT);
            setResult(null);
            setFailure(null);
          }}
        >
          Reset sample
        </Button>
      </div>

      {failure !== null ? (
        <p className="m-0 text-sm text-red-800 dark:text-red-200" role="alert">
          {failure.message}
        </p>
      ) : null}

      {result !== null ? (
        <div className="space-y-3" role="status">
          <p
            className={cn(
              "m-0 text-sm font-medium",
              result.valid ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200",
            )}
          >
            {result.valid ? formatSummary(result.summary) : "Fix validation errors before publishing."}
          </p>

          {errors.length > 0 ? (
            <div className="rounded-md border border-red-600/40 bg-al-surface-raised px-3 py-2 text-xs">
              <p className="m-0 font-medium">Errors</p>
              <ul className="mt-1 mb-0 list-disc pl-4">
                {errors.map((issue) => (
                  <li key={`error:${issue.path ?? ""}:${issue.message ?? ""}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {warnings.length > 0 ? (
            <div className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-xs">
              <p className="m-0 font-medium">Warnings</p>
              <ul className="mt-1 mb-0 list-disc pl-4">
                {warnings.map((issue) => (
                  <li key={`warning:${issue.path ?? ""}:${issue.message ?? ""}`}>{issue.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
