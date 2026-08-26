"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { applyGeneratedCuratedPolicyPack } from "@/lib/apply-generated-curated-policy-pack";
import {
  guidedFieldsFromContentDocument,
  type GuidedPolicyFields,
} from "@/lib/policy/policy-pack-guided-content";
import {
  composePolicyPackContentForPublish,
  createEmptyCuratedRulesDocument,
  hydrateCuratedFromContentDocument,
  type CuratedRulesDocument,
  validateCuratedRulesDocument,
} from "@/lib/policy/policy-pack-curated-rules-v1";
import type { PolicyPackContentDocument } from "@/types/policy-packs";
import { showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";

import {
  PolicyRuleAuthoringWizardModes,
  type AuthoringInputMode,
} from "./PolicyRuleAuthoringWizardModes";
import {
  POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID,
  PolicyRuleAuthoringWizardPublishPanel,
  PolicyRuleAuthoringWizardTestPanel,
} from "./PolicyRuleAuthoringWizardPublish";
import {
  tryParseContentDocument,
  usePolicyRuleAuthoringSimulate,
} from "./use-policy-rule-authoring-simulate";

export type PolicyRuleAuthoringWizardProps = {
  readonly canMutatePacks: boolean;
  readonly loading: boolean;
  readonly bundledPublishBlocked: boolean;
  readonly selectedPackId: string;
  readonly policyContentJson: string;
  readonly onPolicyContentJsonSync: (json: string) => void;
  readonly name: string;
  readonly onNameChange: (value: string) => void;
  readonly description: string;
  readonly onDescriptionChange: (value: string) => void;
  readonly packType: string;
  readonly onPackTypeChange: (value: string) => void;
  readonly publishVersion: string;
  readonly onPublishVersionChange: (value: string) => void;
  readonly onCreate: () => void | Promise<void>;
  readonly onPublish: () => void | Promise<void>;
  readonly highlightRuleId?: string;
  readonly initialInputMode?: "guided" | "visual" | "json" | "ai";
  readonly scopedReviewId?: string;
  readonly onPickReview?: (reviewId: string) => void;
};

function resolveInitialInputMode(
  initialInputMode: PolicyRuleAuthoringWizardProps["initialInputMode"],
): AuthoringInputMode {
  if (initialInputMode === "visual" || initialInputMode === "ai") {
    return initialInputMode;
  }

  return "guided";
}

export function PolicyRuleAuthoringWizard(props: PolicyRuleAuthoringWizardProps) {
  const {
    canMutatePacks,
    loading,
    bundledPublishBlocked,
    selectedPackId,
    policyContentJson,
    onPolicyContentJsonSync,
    name,
    onNameChange,
    description,
    onDescriptionChange,
    packType,
    onPackTypeChange,
    publishVersion,
    onPublishVersionChange,
    onCreate,
    onPublish,
    highlightRuleId,
    initialInputMode = "guided",
    scopedReviewId,
    onPickReview,
  } = props;

  const skipHydrationRef = useRef(false);
  const [inputMode, setInputMode] = useState<AuthoringInputMode>(() => resolveInitialInputMode(initialInputMode));
  const [rawJsonAccordionOpen, setRawJsonAccordionOpen] = useState(initialInputMode === "json");
  const [guidedFields, setGuidedFields] = useState<GuidedPolicyFields>(() => ({
    complianceRuleKeysText: "",
    alertRuleIdsText: "",
    compositeAlertRuleIdsText: "",
    metadataLinesText: "",
  }));
  const [curatedDoc, setCuratedDoc] = useState<CuratedRulesDocument>(() => createEmptyCuratedRulesDocument({}));
  const [authoringErrors, setAuthoringErrors] = useState<string[]>([]);

  useEffect(() => {
    setInputMode(resolveInitialInputMode(initialInputMode));
    setRawJsonAccordionOpen(initialInputMode === "json");
  }, [initialInputMode]);

  useEffect(() => {
    if (skipHydrationRef.current) {
      skipHydrationRef.current = false;

      return;
    }

    const doc: PolicyPackContentDocument | null = tryParseContentDocument(policyContentJson);

    if (doc === null) {
      return;
    }

    const hydrated = hydrateCuratedFromContentDocument(doc);
    setCuratedDoc(hydrated.curated);
    setGuidedFields({
      ...guidedFieldsFromContentDocument(doc),
      complianceRuleKeysText: hydrated.additionalComplianceKeysText,
    });
    setAuthoringErrors([]);
  }, [selectedPackId, policyContentJson]);

  useEffect(() => {
    const ruleId = highlightRuleId?.trim() ?? "";

    if (ruleId.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      const row = document.querySelector(`[data-rule-id="${CSS.escape(ruleId)}"]`);

      if (row !== null) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [highlightRuleId]);

  useEffect(() => {
    if (inputMode !== "guided") {
      return;
    }

    const validationErrors: string[] = validateCuratedRulesDocument(curatedDoc);

    if (validationErrors.length > 0) {
      setAuthoringErrors(validationErrors);

      return;
    }

    setAuthoringErrors([]);
    const doc: PolicyPackContentDocument = composePolicyPackContentForPublish({
      guided: guidedFields,
      curated: curatedDoc,
      packContext: {
        name,
        description,
        version: publishVersion,
        packType,
      },
    });
    const nextJson = JSON.stringify(doc, null, 2);

    if (nextJson === policyContentJson) {
      return;
    }

    skipHydrationRef.current = true;
    onPolicyContentJsonSync(nextJson);
  }, [
    curatedDoc,
    description,
    guidedFields,
    inputMode,
    name,
    onPolicyContentJsonSync,
    packType,
    policyContentJson,
    publishVersion,
  ]);

  const simulateState = usePolicyRuleAuthoringSimulate({
    policyContentJson,
    selectedPackId,
    canMutatePacks,
    loading,
    bundledPublishBlocked,
  });

  useEffect(() => {
    const trimmed = (scopedReviewId ?? "").trim();

    if (trimmed.length > 0) {
      simulateState.setSimulateRunId(trimmed);
    }
  }, [scopedReviewId, simulateState.setSimulateRunId]);

  const applyGeneratedCuratedDocument = useCallback(
    (document: CuratedRulesDocument) => {
      const result = applyGeneratedCuratedPolicyPack({
        document,
        existingName: name,
        existingDescription: description,
        publishVersion,
        packType,
      });

      setCuratedDoc(document);
      setAuthoringErrors([...result.validationErrors]);

      if (result.validationErrors.length > 0) {
        return;
      }

      if (result.name.trim().length > 0) {
        onNameChange(result.name);
      }

      if (result.description.trim().length > 0) {
        onDescriptionChange(result.description);
      }

      onPolicyContentJsonSync(result.contentJson);
      setInputMode("visual");
      showSuccess("Generated pack loaded in the visual builder — review rules before publish.");
    },
    [
      description,
      name,
      onDescriptionChange,
      onNameChange,
      onPolicyContentJsonSync,
      packType,
      publishVersion,
    ],
  );

  const syncGuidedFromCurrentJson = useCallback(() => {
    const doc: PolicyPackContentDocument | null = tryParseContentDocument(policyContentJson);

    if (doc === null) {
      return;
    }

    const hydrated = hydrateCuratedFromContentDocument(doc);
    setCuratedDoc(hydrated.curated);
    setGuidedFields({
      ...guidedFieldsFromContentDocument(doc),
      complianceRuleKeysText: hydrated.additionalComplianceKeysText,
    });
    setAuthoringErrors([]);
    setInputMode("guided");
    showSuccess("Guided fields loaded from current policy JSON.");
  }, [policyContentJson]);

  return (
    <section
      className="mb-8"
      aria-labelledby="policy-rule-authoring-wizard-heading"
      data-testid="policy-rule-authoring-wizard"
    >
      <h3 id="policy-rule-authoring-wizard-heading" className={cn("mt-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Rule authoring workspace
      </h3>
      <p className={cn("max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Design custom policy content and evaluate it against a committed architecture review on one surface, then create
        or publish through the same durable policy-pack versioning as platform defaults.
      </p>
      {!canMutatePacks ? (
        <WhyDisabledCtaHint
          id={POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID}
          testId={POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID}
          reason={whyDisabledEnterpriseMutationControl()}
          className="mt-2"
        />
      ) : null}

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:items-start">
        <PolicyRuleAuthoringWizardModes
          canMutatePacks={canMutatePacks}
          selectedPackId={selectedPackId}
          policyContentJson={policyContentJson}
          onPolicyContentJsonSync={onPolicyContentJsonSync}
          name={name}
          description={description}
          packType={packType}
          publishVersion={publishVersion}
          highlightRuleId={highlightRuleId}
          inputMode={inputMode}
          onInputModeChange={setInputMode}
          rawJsonAccordionOpen={rawJsonAccordionOpen}
          onRawJsonAccordionOpenChange={setRawJsonAccordionOpen}
          guidedFields={guidedFields}
          onGuidedFieldsChange={setGuidedFields}
          curatedDoc={curatedDoc}
          onCuratedDocChange={setCuratedDoc}
          authoringErrors={authoringErrors}
          onApplyGeneratedCuratedDocument={applyGeneratedCuratedDocument}
          onSyncGuidedFromCurrentJson={syncGuidedFromCurrentJson}
          scopedReviewId={scopedReviewId}
          onPickReview={onPickReview}
        />

        <PolicyRuleAuthoringWizardTestPanel
          simulateRunId={simulateState.simulateRunId}
          onSimulateRunIdChange={simulateState.setSimulateRunId}
          recentRuns={simulateState.recentRuns}
          runsLoadError={simulateState.runsLoadError}
          simulateBusy={simulateState.simulateBusy}
          simulateFailure={simulateState.simulateFailure}
          simulateResult={simulateState.simulateResult}
          blockOnCritical={simulateState.blockOnCritical}
          onBlockOnCriticalChange={simulateState.setBlockOnCritical}
          loadRecentRuns={simulateState.loadRecentRuns}
          runSimulation={simulateState.runSimulation}
          parsedDocumentForSimulate={simulateState.parsedDocumentForSimulate}
          scopedReviewId={scopedReviewId}
          onPickReview={onPickReview}
        />
      </div>

      <PolicyRuleAuthoringWizardPublishPanel
        canMutatePacks={canMutatePacks}
        loading={loading}
        bundledPublishBlocked={bundledPublishBlocked}
        name={name}
        onNameChange={onNameChange}
        description={description}
        onDescriptionChange={onDescriptionChange}
        packType={packType}
        onPackTypeChange={onPackTypeChange}
        publishVersion={publishVersion}
        onPublishVersionChange={onPublishVersionChange}
        onCreate={onCreate}
        onPublish={onPublish}
        allowPublishWithoutTest={simulateState.allowPublishWithoutTest}
        onAllowPublishWithoutTestChange={simulateState.setAllowPublishWithoutTest}
        parsedDocumentForSimulate={simulateState.parsedDocumentForSimulate}
        canPublishAfterTest={simulateState.canPublishAfterTest}
        publishDisabled={simulateState.publishDisabled}
      />
    </section>
  );
}
