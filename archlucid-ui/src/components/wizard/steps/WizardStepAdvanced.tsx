"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import type { ReactNode } from "react";
import type { FieldPath } from "react-hook-form";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WizardFieldError } from "@/components/wizard/WizardFieldError";
import { WizardFieldHint } from "@/components/wizard/WizardFieldHint";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { useModelEngineSelectionOptionsQuery } from "@/hooks/use-wizard-advanced-queries";
import { modelExecutionProfileLabel } from "@/lib/model-execution-profile";
import type { ModelEngineSelectionOptionsResponse } from "@/lib/model-governance-types";
import { ARCHITECTURE_HINTS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { useWizardAiSuggestedFields, type WizardAiSuggestedFieldName } from "@/lib/wizard-ai-suggested-fields";
import type { WizardFormValues } from "@/lib/wizard-schema";

type StringListName = "policyReferences" | "topologyHints" | "securityBaselineHints";

function WizardEngineAliasPicker() {
  const { control } = useFormContext<WizardFormValues>();
  const { data: options } = useModelEngineSelectionOptionsQuery();

  if (options == null || options.options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
      <WizardFieldHint
        label="Engine alias"
        hint="Optional per-review engine within the workspace allowed set. Defaults to the workspace standard engine."
      />
      <Controller
        name="modelAliasOverride"
        control={control}
        render={({ field }) => (
          <Select value={field.value.length > 0 ? field.value : "__workspace_default__"} onValueChange={(value) => {
            field.onChange(value === "__workspace_default__" ? "" : value);
          }}>
            <SelectTrigger id="wizard-model-alias-override" data-testid="wizard-model-alias-override">
              <SelectValue placeholder="Workspace default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__workspace_default__">Workspace default</SelectItem>
              {options.options.map((option) => (
                <SelectItem key={option.aliasId} value={option.aliasId}>
                  {option.aliasId}
                  {option.taskEvaluations.some((evaluation) => evaluation.evaluationState === "NotEvaluated")
                    ? " · Not evaluated"
                    : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

function AdvancedChipList(props: {
  fieldName: StringListName;
  title: string;
  hint: string;
  inputId: string;
}) {
  const { watch, setValue, formState, clearErrors } = useFormContext<WizardFormValues>();
  const { isAiSuggested, clearAiSuggested } = useWizardAiSuggestedFields();
  const { errors } = formState;
  const items: string[] = watch(props.fieldName) ?? [];
  const [draft, setDraft] = useState("");
  const listErr = errors[props.fieldName]?.message;

  const addItem = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    clearErrors(props.fieldName);
    setValue(props.fieldName, [...items, trimmed], { shouldValidate: true, shouldDirty: true });
    setDraft("");
  };

  const removeItem = (index: number) => {
    clearAiSuggested(props.fieldName as WizardAiSuggestedFieldName, items[index] ?? "");
    clearErrors(props.fieldName);
    setValue(
      props.fieldName,
      items.filter((_, idx) => idx !== index),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  return (
    <div className="space-y-2">
      <WizardFieldHint htmlFor={props.inputId} label={props.title} hint={props.hint} />
      <div className="flex flex-wrap gap-2">
        <Input
          id={props.inputId}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            clearErrors(props.fieldName);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="max-w-md flex-1 min-w-[12rem]"
        />
        <Button type="button" variant="secondary" onClick={addItem}>
          Add
        </Button>
      </div>
      <WizardFieldError
        id={`err-wizard-adv-${props.fieldName}`}
        message={listErr != null ? String(listErr) : undefined}
      />
      {items.length > 0 ? (
        <ul className="m-0 flex flex-wrap gap-2 p-0 list-none">
          {items.map((item, index) => (
            <li key={`${props.fieldName}-${index}`}>
              <Badge variant="outline" className="gap-1 py-1 pl-2 pr-1 font-normal">
                <span className="max-w-[220px] truncate">{item}</span>
                {isAiSuggested(props.fieldName as WizardAiSuggestedFieldName, item) ? (
                  <span className={cn("rounded bg-violet-100 px-1 font-semibold uppercase tracking-wide text-violet-900 dark:bg-violet-950 dark:text-violet-100", OPERATOR_NAV_GROUP_LABEL)}>
                    AI
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-1"
                  onClick={() => removeItem(index)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CollapsibleSection(props: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
        <DisclosureTriangleIndicator />
        <span className="flex flex-wrap items-center gap-2">
          <span>{props.title}</span>
          {props.count > 0 ? (
            <Badge variant="secondary" className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
              {props.count}
            </Badge>
          ) : null}
        </span>
      </summary>
      <div className="mt-4 space-y-4">{props.children}</div>
    </details>
  );
}

/**
 * Step 5: optional policy hints, architecture structure, security, documents, infrastructure declarations.
 */
export function WizardStepAdvanced() {
  const { control, watch, register, formState, clearErrors } = useFormContext<WizardFormValues>();
  const { errors } = formState;
  const policyReferences = watch("policyReferences") ?? [];
  const topologyHints = watch("topologyHints") ?? [];
  const securityBaselineHints = watch("securityBaselineHints") ?? [];
  const documents = watch("documents") ?? [];
  const infrastructureDeclarations = watch("infrastructureDeclarations") ?? [];

  const {
    fields: docFields,
    append: appendDoc,
    remove: removeDoc,
  } = useFieldArray({ control, name: "documents" });

  const {
    fields: infraFields,
    append: appendInfra,
    remove: removeInfra,
  } = useFieldArray({ control, name: "infrastructureDeclarations" });

  return (
    <WizardStepPanel
      title="Advanced inputs (optional)"
      description="Policy references, architecture and security hints, attached documents, and infrastructure declarations."
    >
      <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        Most reviews only need earlier steps. Open Advanced Options when you want custom policy overrides, structured
        hints, attached documents, or raw infrastructure snippets for agents.
      </p>

      <AdvancedOptionsAccordion className="mt-4">
        <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
          <WizardFieldHint
            label="Model execution profile"
            hint="Optional per-review override. Defaults to the workspace profile configured under Settings → AI and model governance."
          />
          <Controller
            name="modelExecutionProfileOverride"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="wizard-model-execution-profile" data-testid="wizard-model-execution-profile">
                  <SelectValue placeholder="Workspace default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WorkspaceDefault">{modelExecutionProfileLabel("WorkspaceDefault")}</SelectItem>
                  <SelectItem value="Economy">{modelExecutionProfileLabel("Economy")}</SelectItem>
                  <SelectItem value="Balanced">{modelExecutionProfileLabel("Balanced")}</SelectItem>
                  <SelectItem value="HighAssurance">{modelExecutionProfileLabel("HighAssurance")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <WizardEngineAliasPicker />

        <CollapsibleSection title="Policy references (Custom Policy Overrides)" count={policyReferences.length}>
          <AdvancedChipList
            fieldName="policyReferences"
            title="Policy references"
            hint="e.g. policy-pack:enterprise-default — packs that must be evaluated against the proposal."
            inputId="wizard-policy-draft"
          />
        </CollapsibleSection>

        <CollapsibleSection title={ARCHITECTURE_HINTS_BUYER_LABEL} count={topologyHints.length}>
          <AdvancedChipList
            fieldName="topologyHints"
            title={ARCHITECTURE_HINTS_BUYER_LABEL}
            hint="Optional patterns to prefer or avoid (for example hub-spoke, strangler, regional pairs) to steer architecture-structure analysis."
            inputId="wizard-topology-draft"
          />
        </CollapsibleSection>

        <CollapsibleSection title="Security baseline hints" count={securityBaselineHints.length}>
          <AdvancedChipList
            fieldName="securityBaselineHints"
            title="Security baseline hints"
            hint="Short control expectation — ncryption, identity, segmentation, loggin — hat reviewers want honored in the proposal."
            inputId="wizard-security-draft"
          />
        </CollapsibleSection>

        <CollapsibleSection title="Documents" count={documents.filter((d) => d.name.trim() || d.content.trim()).length}>
          <WizardFieldHint
            label="Documents"
            hint="Each row is a named UTF-8 attachment (name, content type, body) merged into agent context alongside the main brief."
          />
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Reference files (ADRs, RFCs) inlined as UTF-8 text for agent context.
          </p>
          {docFields.map((row, index) => (
            <div key={row.id} className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={cn("mb-1 block font-medium", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`doc-name-${index}`}>
                    Name
                  </label>
                  <Input
                    id={`doc-name-${index}`}
                    {...register(`documents.${index}.name`, {
                      onChange: () => {
                        clearErrors(`documents.${index}.name` as FieldPath<WizardFormValues>);
                      },
                    })}
                  />
                  <WizardFieldError
                    message={
                      errors.documents?.[index]?.name?.message != null
                        ? String(errors.documents[index]!.name!.message)
                        : undefined
                    }
                  />
                </div>
                <div>
                  <label className={cn("mb-1 block font-medium", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`doc-ct-${index}`}>
                    Content type
                  </label>
                  <Input
                    id={`doc-ct-${index}`}
                    {...register(`documents.${index}.contentType`, {
                      onChange: () => {
                        clearErrors(`documents.${index}.contentType` as FieldPath<WizardFormValues>);
                      },
                    })}
                  />
                  <WizardFieldError
                    message={
                      errors.documents?.[index]?.contentType?.message != null
                        ? String(errors.documents[index]!.contentType!.message)
                        : undefined
                    }
                  />
                </div>
              </div>
              <div>
                <label className={cn("mb-1 block font-medium", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`doc-body-${index}`}>
                  Content
                </label>
                <Textarea
                  id={`doc-body-${index}`}
                  rows={4}
                  {...register(`documents.${index}.content`, {
                    onChange: () => {
                      clearErrors(`documents.${index}.content` as FieldPath<WizardFormValues>);
                    },
                  })}
                />
                <WizardFieldError
                  message={
                    errors.documents?.[index]?.content?.message != null
                      ? String(errors.documents[index]!.content!.message)
                      : undefined
                  }
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeDoc(index)}>
                Remove document
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() => appendDoc({ name: "", contentType: "text/plain", content: "" })}
          >
            Add document
          </Button>
        </CollapsibleSection>

        <CollapsibleSection
          title="Infrastructure declarations (Raw JSON Editors)"
          count={infrastructureDeclarations.filter((d) => d.name.trim() || d.content.trim()).length}
        >
          <WizardFieldHint
            label="Infrastructure declarations"
            hint="Raw JSON or simple-Terraform snippets describe estate in place so agents diff against truth instead of assuming greenfield."
          />
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Existing IaC or config snippets agents should reason about.
          </p>
          {infraFields.map((row, index) => (
            <div key={row.id} className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={cn("mb-1 block font-medium", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`infra-name-${index}`}>
                    Name
                  </label>
                  <Input
                    id={`infra-name-${index}`}
                    {...register(`infrastructureDeclarations.${index}.name`, {
                      onChange: () => {
                        clearErrors(`infrastructureDeclarations.${index}.name` as FieldPath<WizardFormValues>);
                      },
                    })}
                  />
                  <WizardFieldError
                    message={
                      errors.infrastructureDeclarations?.[index]?.name?.message != null
                        ? String(errors.infrastructureDeclarations[index]!.name!.message)
                        : undefined
                    }
                  />
                </div>
                <div>
                  <label className={cn("mb-1 block font-medium", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`infra-format-${index}`}>
                    Format
                  </label>
                  <Controller
                    name={`infrastructureDeclarations.${index}.format`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "json"}
                        onValueChange={(v) => {
                          clearErrors(`infrastructureDeclarations.${index}.format` as FieldPath<WizardFormValues>);
                          field.onChange(v);
                        }}
                      >
                        <SelectTrigger id={`infra-format-${index}`}>
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">json</SelectItem>
                          <SelectItem value="simple-terraform">simple-terraform</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <WizardFieldError
                    message={
                      errors.infrastructureDeclarations?.[index]?.format?.message != null
                        ? String(errors.infrastructureDeclarations[index]!.format!.message)
                        : undefined
                    }
                  />
                </div>
              </div>
              <div>
                <label className={cn("mb-1 block font-medium", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`infra-body-${index}`}>
                  Content
                </label>
                <Textarea
                  id={`infra-body-${index}`}
                  rows={4}
                  {...register(`infrastructureDeclarations.${index}.content`, {
                    onChange: () => {
                      clearErrors(`infrastructureDeclarations.${index}.content` as FieldPath<WizardFormValues>);
                    },
                  })}
                />
                <WizardFieldError
                  message={
                    errors.infrastructureDeclarations?.[index]?.content?.message != null
                      ? String(errors.infrastructureDeclarations[index]!.content!.message)
                      : undefined
                  }
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeInfra(index)}>
                Remove declaration
              </Button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => appendInfra({ name: "", format: "json", content: "" })}>
            Add declaration
          </Button>
        </CollapsibleSection>
      </AdvancedOptionsAccordion>
    </WizardStepPanel>
  );
}
