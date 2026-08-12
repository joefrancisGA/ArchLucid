"use client";

import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { PolicyPackJsonSchemaHelpIcon } from "@/lib/policy-pack-json-schema-hint";
import { usePolicyPackContentJsonValidation } from "@/lib/use-policy-pack-content-json-validation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PolicyPackContentJsonEditorProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly readOnly?: boolean;
  readonly rows?: number;
  readonly testId?: string;
  readonly title?: string;
  readonly schemaHelpAriaLabel?: string;
};

function formatValidationSummary(
  summary: NonNullable<ReturnType<typeof usePolicyPackContentJsonValidation>["summary"]>,
): string {
  const ruleCount = (summary.complianceRuleIdCount ?? 0) + (summary.complianceRuleKeyCount ?? 0);

  return `${ruleCount} compliance rules, ${summary.alertRuleIdCount ?? 0} alert rules, ${summary.advisoryDefaultCount ?? 0} advisory defaults.`;
}

export function PolicyPackContentJsonEditor(props: PolicyPackContentJsonEditorProps) {
  const {
    id,
    label,
    value,
    onChange,
    readOnly = false,
    rows = 12,
    testId,
    title,
    schemaHelpAriaLabel = "Brief policy-pack JSON schema reference",
  } = props;

  const validation = usePolicyPackContentJsonValidation(value);
  const hasBlockingIssues = validation.blockingIssues.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const describedByIds = [
    hasBlockingIssues ? `${id}-validation-errors` : null,
    hasWarnings ? `${id}-validation-warnings` : null,
  ]
    .filter((entry): entry is string => entry !== null)
    .join(" ");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <label htmlFor={id} className={cn("min-w-[12rem] flex-1 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          {label}
        </label>
        <PolicyPackJsonSchemaHelpIcon ariaLabel={schemaHelpAriaLabel} />
      </div>
      <Textarea
        id={id}
        data-testid={testId}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        readOnly={readOnly}
        title={title}
        rows={rows}
        className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.helper,
          hasBlockingIssues && "border-red-500 focus-visible:ring-red-500 dark:border-red-600",
          !hasBlockingIssues && hasWarnings && "border-amber-500 focus-visible:ring-amber-500 dark:border-amber-600",
        )}
        aria-invalid={hasBlockingIssues}
        aria-describedby={describedByIds.length > 0 ? describedByIds : undefined}
      />
      {validation.validationUnavailable ? (
        <p className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Server validation is temporarily unavailable; fix JSON syntax locally before create or publish.
        </p>
      ) : null}
      {validation.validating ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status" data-testid={`${testId ?? id}-validating`}>
          Validating policy pack JSON…
        </p>
      ) : null}
      {validation.validationReady && hasBlockingIssues ? (
        <div
          id={`${id}-validation-errors`}
          role="alert"
          data-testid={`${testId ?? id}-validation-errors`}
          className={cn(
            "rounded-md border border-red-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-red-700/50",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Fix JSON before create or publish</p>
          <ul className="mt-1 mb-0 list-disc pl-4">
            {validation.blockingIssues.map((issue) => (
              <li key={`${issue.kind}:${issue.path ?? ""}:${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {validation.validationReady && hasWarnings ? (
        <div
          id={`${id}-validation-warnings`}
          role="status"
          data-testid={`${testId ?? id}-validation-warnings`}
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Warnings</p>
          <ul className="mt-1 mb-0 list-disc pl-4">
            {validation.warnings.map((issue) => (
              <li key={`${issue.kind}:${issue.path ?? ""}:${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {validation.validationReady &&
      !validation.validating &&
      !hasBlockingIssues &&
      value.trim().length > 0 &&
      validation.valid ? (
        <p
          className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          data-testid={`${testId ?? id}-validation-valid`}
        >
          Valid policy pack JSON
          {validation.summary !== undefined ? ` — ${formatValidationSummary(validation.summary)}` : ""}
        </p>
      ) : null}
    </div>
  );
}
