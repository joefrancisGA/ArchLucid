"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";
import type { FieldPath } from "react-hook-form";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
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
import { modelExecutionProfileLabel } from "@/lib/model-execution-profile";
import { ARCHITECTURE_HINTS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import type { WizardFormValues } from "@/lib/wizard-schema";

import { WizardAdvancedChipList } from "./WizardAdvancedChipList";
import { WizardAdvancedCollapsibleSection } from "./WizardAdvancedCollapsibleSection";
import { WizardEngineAliasPicker } from "./WizardEngineAliasPicker";

/**
 * Step 5: optional policy hints, architecture structure, security, documents, infrastructure declarations.
 */
export function WizardStepAdvanced(): ReactElement {
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
            hint="Optional per-review override. Defaults to the workspace profile configured under Settings → AI and model policy."
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

        <WizardAdvancedCollapsibleSection title="Policy references (Custom Policy Overrides)" count={policyReferences.length}>
          <WizardAdvancedChipList
            fieldName="policyReferences"
            title="Policy references"
            hint="e.g. policy-pack:enterprise-default — packs that must be evaluated against the proposal."
            inputId="wizard-policy-draft"
          />
        </WizardAdvancedCollapsibleSection>

        <WizardAdvancedCollapsibleSection title={ARCHITECTURE_HINTS_BUYER_LABEL} count={topologyHints.length}>
          <WizardAdvancedChipList
            fieldName="topologyHints"
            title={ARCHITECTURE_HINTS_BUYER_LABEL}
            hint="Optional patterns to prefer or avoid (for example hub-spoke, strangler, regional pairs) to steer architecture-structure analysis."
            inputId="wizard-topology-draft"
          />
        </WizardAdvancedCollapsibleSection>

        <WizardAdvancedCollapsibleSection title="Security baseline hints" count={securityBaselineHints.length}>
          <WizardAdvancedChipList
            fieldName="securityBaselineHints"
            title="Security baseline hints"
            hint="Short control expectation — encryption, identity, segmentation, logging — that reviewers want honored in the proposal."
            inputId="wizard-security-draft"
          />
        </WizardAdvancedCollapsibleSection>

        <WizardAdvancedCollapsibleSection title="Documents" count={documents.filter((d) => d.name.trim() || d.content.trim()).length}>
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
        </WizardAdvancedCollapsibleSection>

        <WizardAdvancedCollapsibleSection
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
        </WizardAdvancedCollapsibleSection>
      </AdvancedOptionsAccordion>
    </WizardStepPanel>
  );
}
