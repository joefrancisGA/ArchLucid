"use client";

import { cn } from "@/lib/utils";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { Button } from "@/components/ui/button";
import { PolicyPackContentJsonEditor } from "@/components/policy/PolicyPackContentJsonEditor";
import { Textarea } from "@/components/ui/textarea";
import type { GuidedPolicyFields } from "@/lib/policy/policy-pack-guided-content";
import type { CuratedRulesDocument } from "@/lib/policy/policy-pack-curated-rules-v1";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { CuratedRulesAuthoringSection } from "./CuratedRulesAuthoringSection";
import {
  PolicyPackNaturalLanguageBuilderDeferred,
  PolicyPackVisualBuilderDeferred,
} from "./policy-packs-authoring-deferred-chunks";

export type AuthoringInputMode = "guided" | "visual" | "json" | "ai";

export type PolicyRuleAuthoringWizardModesProps = {
  readonly canMutatePacks: boolean;
  readonly selectedPackId: string;
  readonly policyContentJson: string;
  readonly onPolicyContentJsonSync: (json: string) => void;
  readonly name: string;
  readonly description: string;
  readonly packType: string;
  readonly publishVersion: string;
  readonly highlightRuleId?: string;
  readonly inputMode: AuthoringInputMode;
  readonly onInputModeChange: (mode: AuthoringInputMode) => void;
  readonly rawJsonAccordionOpen: boolean;
  readonly onRawJsonAccordionOpenChange: (open: boolean) => void;
  readonly guidedFields: GuidedPolicyFields;
  readonly onGuidedFieldsChange: (fields: GuidedPolicyFields) => void;
  readonly curatedDoc: CuratedRulesDocument;
  readonly onCuratedDocChange: (doc: CuratedRulesDocument) => void;
  readonly authoringErrors: readonly string[];
  readonly onApplyGeneratedCuratedDocument: (document: CuratedRulesDocument) => void;
  readonly onSyncGuidedFromCurrentJson: () => void;
  readonly scopedReviewId?: string;
  readonly onPickReview?: (reviewId: string) => void;
};

export function PolicyRuleAuthoringWizardModes(props: PolicyRuleAuthoringWizardModesProps): React.JSX.Element {
  const {
    canMutatePacks,
    selectedPackId,
    policyContentJson,
    onPolicyContentJsonSync,
    name,
    description,
    packType,
    publishVersion,
    highlightRuleId,
    inputMode,
    onInputModeChange,
    rawJsonAccordionOpen,
    onRawJsonAccordionOpenChange,
    guidedFields,
    onGuidedFieldsChange,
    curatedDoc,
    onCuratedDocChange,
    authoringErrors,
    onApplyGeneratedCuratedDocument,
    onSyncGuidedFromCurrentJson,
    scopedReviewId,
    onPickReview,
  } = props;

  return (
    <div className="space-y-4" data-testid="policy-rule-wizard-step-design">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Rule authoring input mode"
          >
            <Button
              type="button"
              size="sm"
              variant={inputMode === "guided" ? "default" : "secondary"}
              aria-pressed={inputMode === "guided"}
              onClick={() => onInputModeChange("guided")}
            >
              Guided fields
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "ai" ? "default" : "secondary"}
              aria-pressed={inputMode === "ai"}
              onClick={() => onInputModeChange("ai")}
              data-testid="policy-rule-wizard-ai-tab"
            >
              AI builder
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "visual" ? "default" : "secondary"}
              aria-pressed={inputMode === "visual"}
              onClick={() => onInputModeChange("visual")}
              data-testid="policy-rule-wizard-visual-tab"
            >
              Visual builder
            </Button>
          </div>

          {inputMode === "ai" ? (
            <PolicyPackNaturalLanguageBuilderDeferred
              canMutatePacks={canMutatePacks}
              onGenerated={onApplyGeneratedCuratedDocument}
            />
          ) : null}

          {inputMode === "visual" ? (
            <PolicyPackVisualBuilderDeferred
              canMutatePacks={canMutatePacks}
              policyContentJson={policyContentJson}
              onPolicyContentJsonSync={onPolicyContentJsonSync}
              selectedPackId={selectedPackId}
              scopedReviewId={scopedReviewId}
              onPickReview={onPickReview}
            />
          ) : null}

          {inputMode === "guided" ? (
            <div className="grid gap-3">
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Map compliance rule keys and optional alert hooks; metadata lines use{" "}
                <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">key=value</code> per line. Policy JSON
                stays in sync as you edit.
              </p>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-keys" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Compliance rule keys
                </label>
                <Textarea
                  id="wizard-guided-keys"
                  value={guidedFields.complianceRuleKeysText}
                  onChange={(e) =>
                    onGuidedFieldsChange({ ...guidedFields, complianceRuleKeysText: e.target.value })
                  }
                  rows={5}
                  className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
                  placeholder={"pci.segmentation.boundary-enforced"}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-alerts" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Alert rule ids (optional)
                </label>
                <Textarea
                  id="wizard-guided-alerts"
                  value={guidedFields.alertRuleIdsText}
                  onChange={(e) =>
                    onGuidedFieldsChange({ ...guidedFields, alertRuleIdsText: e.target.value })
                  }
                  rows={2}
                  className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-composite" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Composite alert rule ids (optional)
                </label>
                <Textarea
                  id="wizard-guided-composite"
                  value={guidedFields.compositeAlertRuleIdsText}
                  onChange={(e) =>
                    onGuidedFieldsChange({ ...guidedFields, compositeAlertRuleIdsText: e.target.value })
                  }
                  rows={2}
                  className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-meta" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Metadata (optional)
                </label>
                <Textarea
                  id="wizard-guided-meta"
                  value={guidedFields.metadataLinesText}
                  onChange={(e) =>
                    onGuidedFieldsChange({ ...guidedFields, metadataLinesText: e.target.value })
                  }
                  rows={2}
                  className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
                  placeholder={"vertical=healthcare"}
                />
              </div>
              <CuratedRulesAuthoringSection
                canMutatePacks={canMutatePacks}
                curatedDoc={curatedDoc}
                onCuratedDocChange={onCuratedDocChange}
                packName={name}
                packDescription={description}
                publishVersion={publishVersion}
                packType={packType}
                highlightRuleId={highlightRuleId}
              />
              {authoringErrors.length > 0 ? (
                <div
                  role="alert"
                  className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised p-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.helper)}
                >
                  <p className={cn("m-0 mb-1 font-medium", OPERATOR_TYPOGRAPHY.body)}>Fix before testing or publish</p>
                  <ul className="list-disc ml-4 m-0">
                    {authoringErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <AdvancedOptionsAccordion
            triggerLabel="View raw policy JSON"
            defaultOpen={rawJsonAccordionOpen}
            open={rawJsonAccordionOpen}
            onOpenChange={onRawJsonAccordionOpenChange}
          >
            <PolicyPackContentJsonEditor
              id="wizard-raw-json"
              label="Policy pack content document (JSON)"
              testId="policy-rule-wizard-raw-json"
              value={policyContentJson}
              onChange={onPolicyContentJsonSync}
              rows={14}
              readOnly={!canMutatePacks}
            />
            {!canMutatePacks ? (
              <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Reader tier: JSON edits are disabled.</p>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={() => onSyncGuidedFromCurrentJson()}>
              Load guided fields from current JSON
            </Button>
          </AdvancedOptionsAccordion>
    </div>
  );
}
