"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import type { CuratedRulesDocument } from "@/lib/policy-pack-curated-rules-v1";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { PACK_TYPES } from "./policy-packs-page-constants";
import { PolicyPackNaturalLanguageBuilderDeferred } from "./policy-packs-authoring-deferred-chunks";

export type PolicyPackGeneratorSectionProps = {
  readonly canMutatePacks: boolean;
  readonly loading: boolean;
  readonly name: string;
  readonly description: string;
  readonly packType: string;
  readonly publishVersion: string;
  readonly generatedRuleCount: number;
  readonly validationErrors: readonly string[];
  readonly onNameChange: (value: string) => void;
  readonly onDescriptionChange: (value: string) => void;
  readonly onPackTypeChange: (value: string) => void;
  readonly onGenerated: (document: CuratedRulesDocument) => void;
  readonly onCreatePack: () => void | Promise<void>;
  readonly onOpenAuthoringWizard: () => void;
};

/** First-class AI policy pack generator — plain-English intent to tenant-owned pack draft. */
export function PolicyPackGeneratorSection(props: PolicyPackGeneratorSectionProps) {
  const {
    canMutatePacks,
    loading,
    name,
    description,
    packType,
    publishVersion,
    generatedRuleCount,
    validationErrors,
    onNameChange,
    onDescriptionChange,
    onPackTypeChange,
    onGenerated,
    onCreatePack,
    onOpenAuthoringWizard,
  } = props;

  const [createAttempted, setCreateAttempted] = useState(false);
  const hasDraft = generatedRuleCount > 0 && validationErrors.length === 0;

  return (
    <section
      className="space-y-4"
      aria-labelledby="policy-pack-generator-heading"
      data-testid="policy-pack-generator-section"
    >
      <div>
        <h2 id="policy-pack-generator-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Policy pack generator
        </h2>
        <p className={cn("mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Describe governance intent in plain language. ArchLucid drafts a curated rules document you can refine,
          simulate against a committed review, and publish — without writing JSON or YAML by hand.
        </p>
      </div>

      <PolicyPackNaturalLanguageBuilderDeferred canMutatePacks={canMutatePacks} onGenerated={onGenerated} />

      {validationErrors.length > 0 ? (
        <div
          className={cn(
            "rounded-md border border-amber-600/40 bg-amber-50/70 p-3 text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="alert"
          data-testid="policy-pack-generator-validation"
        >
          <p className="m-0 font-medium">Generated document needs fixes before create/publish:</p>
          <ul className="mb-0 mt-2 list-disc pl-5">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasDraft ? (
        <div
          className="space-y-4 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="policy-pack-generator-draft"
        >
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-semibold text-al-text-primary">{generatedRuleCount}</span>
            {" "}
            {generatedRuleCount === 1 ? "rule" : "rules"} ready for tenant-owned pack{" "}
            <span className={cn("font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>v{publishVersion}</span>
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className={cn("space-y-1", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium text-al-text-primary">Pack name</span>
              <Input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                data-testid="policy-pack-generator-name"
              />
            </label>
            <label className={cn("space-y-1", OPERATOR_TYPOGRAPHY.body)}>
              <span className="font-medium text-al-text-primary">Pack type</span>
              <select
                value={packType}
                onChange={(event) => onPackTypeChange(event.target.value)}
                disabled={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className={cn(
                  "block w-full rounded-md border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-950",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                data-testid="policy-pack-generator-pack-type"
              >
                {PACK_TYPES.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={cn("block space-y-1", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-medium text-al-text-primary">Description</span>
            <Input
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              readOnly={!canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              data-testid="policy-pack-generator-description"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!canMutatePacks || loading || name.trim().length === 0}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              data-testid="policy-pack-generator-create"
              onClick={() => {
                setCreateAttempted(true);
                void onCreatePack();
              }}
            >
              Create tenant pack
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canMutatePacks}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              data-testid="policy-pack-generator-open-wizard"
              onClick={onOpenAuthoringWizard}
            >
              Test and publish in wizard
            </Button>
          </div>

          {createAttempted && name.trim().length === 0 ? (
            <p className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="alert">
              Enter a pack name before creating.
            </p>
          ) : null}
        </div>
      ) : null}

      {!canMutatePacks ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Pack generation is read-only in this workspace context. Switch to an execute-capable operator scope to create
          tenant-owned packs.
        </p>
      ) : null}
    </section>
  );
}
