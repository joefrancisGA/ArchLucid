"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import type { CuratedRulesDocument } from "@/lib/policy-pack-curated-rules-v1";
import { cn } from "@/lib/utils";

import { PACK_TYPES } from "./policy-packs-page-constants";
import { PolicyPackNaturalLanguageBuilder } from "./PolicyPackNaturalLanguageBuilder";

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
        <h2 id="policy-pack-generator-heading" className="m-0 text-base font-semibold text-al-text-primary">
          Policy pack generator
        </h2>
        <p className="mt-1 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Describe governance intent in plain language. ArchLucid drafts a curated rules document you can refine,
          simulate against a committed review, and publish — without writing JSON or YAML by hand.
        </p>
      </div>

      <PolicyPackNaturalLanguageBuilder canMutatePacks={canMutatePacks} onGenerated={onGenerated} />

      {validationErrors.length > 0 ? (
        <div
          className="rounded-md border border-amber-600/40 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100"
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
          <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
            <span className="font-semibold text-al-text-primary">{generatedRuleCount}</span>
            {" "}
            {generatedRuleCount === 1 ? "rule" : "rules"} ready for tenant-owned pack{" "}
            <span className="font-mono text-xs text-neutral-500">v{publishVersion}</span>
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-al-text-primary">Pack name</span>
              <Input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                data-testid="policy-pack-generator-name"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-al-text-primary">Pack type</span>
              <select
                value={packType}
                onChange={(event) => onPackTypeChange(event.target.value)}
                disabled={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="block w-full rounded-md border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
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

          <label className="block space-y-1 text-sm">
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
            <p className="m-0 text-xs text-amber-800 dark:text-amber-200" role="alert">
              Enter a pack name before creating.
            </p>
          ) : null}
        </div>
      ) : null}

      {!canMutatePacks ? (
        <p className={cn("text-sm text-neutral-600 dark:text-neutral-400")}>
          Pack generation is read-only in this workspace context. Switch to an execute-capable operator scope to create
          tenant-owned packs.
        </p>
      ) : null}
    </section>
  );
}
