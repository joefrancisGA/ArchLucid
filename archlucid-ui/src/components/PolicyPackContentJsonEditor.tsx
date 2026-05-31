"use client";

import { Textarea } from "@/components/ui/textarea";
import { PolicyPackJsonSchemaHelpIcon } from "@/lib/policy-pack-json-schema-hint";
import { usePolicyPackContentJsonValidation } from "@/lib/use-policy-pack-content-json-validation";
import { cn } from "@/lib/utils";

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
  const hasIssues = validation.issues.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start gap-2">
        <label htmlFor={id} className="min-w-[12rem] flex-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
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
        className={cn(
          "mt-1 font-mono text-xs",
          hasIssues && "border-amber-500 focus-visible:ring-amber-500 dark:border-amber-600",
        )}
        aria-invalid={hasIssues}
        aria-describedby={hasIssues ? `${id}-validation` : undefined}
      />
      {validation.schemaLoadFailed ? (
        <p className="text-xs text-amber-800 dark:text-amber-200" role="status">
          Schema validation is temporarily unavailable; syntax is still checked locally when you save.
        </p>
      ) : null}
      {validation.schemaReady && hasIssues ? (
        <div
          id={`${id}-validation`}
          role="alert"
          className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-3 py-2 text-xs"
        >
          <p className="m-0 font-medium">Fix JSON before create or publish</p>
          <ul className="mt-1 mb-0 list-disc pl-4">
            {validation.issues.map((issue) => (
              <li key={`${issue.kind}:${issue.path ?? ""}:${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {validation.schemaReady && !hasIssues && value.trim().length > 0 ? (
        <p className="text-xs text-emerald-800 dark:text-emerald-200" role="status">
          Valid policy pack JSON
        </p>
      ) : null}
    </div>
  );
}
