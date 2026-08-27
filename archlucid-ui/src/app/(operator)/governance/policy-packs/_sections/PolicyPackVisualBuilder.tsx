"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PolicySimulator } from "@/components/governance/PolicySimulator";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showSuccess } from "@/lib/toast";

import { PolicyPackVisualConditionEditor } from "./PolicyPackVisualConditionEditor";
import {
  usePolicyPackVisualBuilder,
  type PolicyPackVisualBuilderProps,
} from "./use-policy-pack-visual-builder";

export type { PolicyPackVisualBuilderProps };

export function PolicyPackVisualBuilder(props: PolicyPackVisualBuilderProps) {
  const builder = usePolicyPackVisualBuilder(props);

  return (
    <section aria-labelledby="visual-builder-heading" className="space-y-4 rounded-lg border border-border p-4">
      <h3 id="visual-builder-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Visual policy pack builder
      </h3>
      <p className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}>
        Pick a starter template, compose conditions, and keep JSON as the source of truth for simulate/publish.
      </p>

      {builder.templatesError !== null ? (
        <p className={cn("text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {builder.templatesError}
        </p>
      ) : null}

      {builder.roundTripWarning !== null ? (
        <p
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          {builder.roundTripWarning}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3">
          <p className={cn("text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>Templates</p>
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-md border border-border p-2">
            {[...builder.groupedTemplates.entries()].map(([category, items]) => (
              <div key={category}>
                <p className={cn("font-semibold text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>{category}</p>
                <ul className="mt-1 space-y-1">
                  {items.map((template) => (
                    <li key={template.templateId}>
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded px-2 py-1 text-left hover:bg-accent",
                          OPERATOR_TYPOGRAPHY.body,
                          builder.selectedTemplateId === template.templateId && "bg-accent font-medium",
                        )}
                        onClick={() => builder.loadTemplate(template)}
                        data-testid={`visual-template-${template.templateId}`}
                      >
                        {template.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <PolicyPackVisualConditionEditor
          canMutatePacks={builder.canMutatePacks}
          builderState={builder.builderState}
          syncFromBuilder={builder.syncFromBuilder}
          onAddLeafCondition={builder.addLeafCondition}
          onAddGroupCondition={builder.addGroupCondition}
        />

        <div className="space-y-2 lg:col-span-3">
          <p className={cn("text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>Live JSON preview</p>
          <Textarea
            className={cn("min-h-80 font-mono", OPERATOR_TYPOGRAPHY.micro)}
            value={builder.jsonPreview}
            disabled={!builder.canMutatePacks}
            onChange={(event) => builder.onJsonPreviewEdit(event.target.value)}
            data-testid="visual-builder-json-preview"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
        <div className="space-y-2">
          {!builder.scopedReviewFilterActive && builder.requiresReviewPick ? (
            <>
              <Label htmlFor="visual-builder-run-picker">Finalized review</Label>
              <div className="min-w-[16rem] max-w-xl">
                <AskRunIdPicker
                  value=""
                  onChange={(value) => {
                    if (value.trim().length > 0) {
                      builder.onPickReview?.(value.trim());
                    }
                  }}
                  selectedThreadId=""
                  committedOnly
                  preferAutoPick={false}
                  autoSelectSyntheticSample={false}
                  label="Review package"
                  fieldId="visual-builder-run-picker"
                  hideFieldHelper
                />
              </div>
            </>
          ) : builder.scopedReviewFilterActive ? (
            <p
              className={cn("m-0 text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}
              data-testid="visual-builder-run-scope-banner"
            >
              {"Validating policy content for review "}
              <span className="font-mono text-al-text-primary">{builder.scopedReviewId}</span>
              {" · "}
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={builder.validateClearScopeHref}>
                Clear review scope
              </Link>
              {" · "}
              <Link
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                href={`/architecture/reviews/${encodeURIComponent(builder.scopedReviewId)}`}
              >
                Open review
              </Link>
            </p>
          ) : (
            <>
              <Label htmlFor="visual-builder-run-picker">Finalized review</Label>
              <div className="min-w-[16rem] max-w-xl">
                <AskRunIdPicker
                  value={builder.scopedReviewId}
                  onChange={() => undefined}
                  selectedThreadId=""
                  committedOnly
                  preferAutoPick={false}
                  autoSelectSyntheticSample={false}
                  label="Review package"
                  fieldId="visual-builder-run-picker"
                  hideFieldHelper
                />
              </div>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!builder.canMutatePacks || builder.simulateBusy}
          onClick={() => void builder.runSimulate()}
        >
          Validate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!builder.canMutatePacks}
          onClick={() => {
            builder.onPolicyContentJsonSync(builder.jsonPreview);
            showSuccess("Draft JSON synced for publish.");
          }}
        >
          Save draft
        </Button>
      </div>

      {builder.simulateFailure !== null ? (
        <p className={cn("text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {builder.simulateFailure.message}
        </p>
      ) : null}

      {builder.simulateResult !== null ? <PolicySimulator result={builder.simulateResult} /> : null}
    </section>
  );
}
