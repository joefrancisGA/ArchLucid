"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolicyPackContentJsonEditor } from "@/components/policy/PolicyPackContentJsonEditor";
import { Textarea } from "@/components/ui/textarea";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { PolicySimulator } from "@/components/governance/PolicySimulator";
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

import { PACK_TYPES } from "./policy-packs-page-constants";
import { CuratedRulesAuthoringSection } from "./CuratedRulesAuthoringSection";
import {
  PolicyPackNaturalLanguageBuilderDeferred,
  PolicyPackVisualBuilderDeferred,
} from "./policy-packs-authoring-deferred-chunks";
import {
  tryParseContentDocument,
  usePolicyRuleAuthoringSimulate,
} from "./use-policy-rule-authoring-simulate";

const POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID = "policy-rule-wizard-mutate-disabled-hint";
const POLICY_RULE_WIZARD_BUNDLED_PUBLISH_BLOCKED_HINT_ID = "policy-rule-wizard-bundled-publish-blocked-hint";

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
};

type AuthoringInputMode = "guided" | "visual" | "ai";

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

  const {
    simulateRunId,
    setSimulateRunId,
    recentRuns,
    runsLoadError,
    simulateBusy,
    simulateFailure,
    simulateResult,
    blockOnCritical,
    setBlockOnCritical,
    allowPublishWithoutTest,
    setAllowPublishWithoutTest,
    loadRecentRuns,
    runSimulation,
    parsedDocumentForSimulate,
    canPublishAfterTest,
    publishDisabled,
  } = usePolicyRuleAuthoringSimulate({
    policyContentJson,
    selectedPackId,
    canMutatePacks,
    loading,
    bundledPublishBlocked,
  });

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
              onClick={() => setInputMode("guided")}
            >
              Guided fields
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "ai" ? "default" : "secondary"}
              aria-pressed={inputMode === "ai"}
              onClick={() => setInputMode("ai")}
              data-testid="policy-rule-wizard-ai-tab"
            >
              AI builder
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "visual" ? "default" : "secondary"}
              aria-pressed={inputMode === "visual"}
              onClick={() => setInputMode("visual")}
              data-testid="policy-rule-wizard-visual-tab"
            >
              Visual builder
            </Button>
          </div>

          {inputMode === "ai" ? (
            <PolicyPackNaturalLanguageBuilderDeferred
              canMutatePacks={canMutatePacks}
              onGenerated={applyGeneratedCuratedDocument}
            />
          ) : null}

          {inputMode === "visual" ? (
            <PolicyPackVisualBuilderDeferred
              canMutatePacks={canMutatePacks}
              policyContentJson={policyContentJson}
              onPolicyContentJsonSync={onPolicyContentJsonSync}
              selectedPackId={selectedPackId}
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
                    setGuidedFields((f) => ({ ...f, complianceRuleKeysText: e.target.value }))
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
                    setGuidedFields((f) => ({ ...f, alertRuleIdsText: e.target.value }))
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
                    setGuidedFields((f) => ({ ...f, compositeAlertRuleIdsText: e.target.value }))
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
                    setGuidedFields((f) => ({ ...f, metadataLinesText: e.target.value }))
                  }
                  rows={2}
                  className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}
                  placeholder={"vertical=healthcare"}
                />
              </div>
              <CuratedRulesAuthoringSection
                canMutatePacks={canMutatePacks}
                curatedDoc={curatedDoc}
                onCuratedDocChange={setCuratedDoc}
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
            onOpenChange={setRawJsonAccordionOpen}
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
            <Button type="button" size="sm" variant="secondary" onClick={() => syncGuidedFromCurrentJson()}>
              Load guided fields from current JSON
            </Button>
          </AdvancedOptionsAccordion>
        </div>

        <div
          className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
          data-testid="policy-rule-wizard-step-test"
        >
          <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Test on review</h4>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Dry-run this policy content against a committed architecture snapshot without leaving the authoring surface.
          </p>

          {parsedDocumentForSimulate === null ? (
            <p className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="status">
              Fix invalid policy JSON or guided-field validation errors before running a test.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <label htmlFor="wizard-run-id" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                Review ID
              </label>
              <Input
                id="wizard-run-id"
                data-testid="policy-rule-wizard-run-id"
                value={simulateRunId}
                onChange={(e) => setSimulateRunId(e.target.value)}
                className={cn("w-full max-w-xs font-mono", OPERATOR_TYPOGRAPHY.micro)}
              />
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => void loadRecentRuns()}>
              Load recent reviews
            </Button>
          </div>

          {runsLoadError !== null ? (
            <p className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>{runsLoadError}</p>
          ) : null}

          {recentRuns.length > 0 ? (
            <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
              Pick a recent review
              <select
                className={cn("mt-1 block w-full max-w-xl p-2", OPERATOR_TYPOGRAPHY.body)}
                value=""
                onChange={(e) => setSimulateRunId(e.target.value)}
              >
                <option value="" disabled>
                  Select…
                </option>
                {recentRuns.map((r) => (
                  <option key={r.runId} value={r.runId}>
                    {r.displayName?.trim() ?? r.runId}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
            <input
              type="checkbox"
              checked={blockOnCritical}
              onChange={(e) => setBlockOnCritical(e.target.checked)}
            />
            Treat critical findings as blocking before finalize
          </label>

          <Button
            type="button"
            size="sm"
            onClick={() => void runSimulation()}
            disabled={simulateBusy || parsedDocumentForSimulate === null}
          >
            {simulateBusy ? "Testing…" : "Run policy test"}
          </Button>

          {simulateFailure !== null ? (
            <div role="alert">
              <OperatorApiProblem
                problem={simulateFailure.problem}
                fallbackMessage={simulateFailure.message}
                correlationId={simulateFailure.correlationId}
              />
            </div>
          ) : null}

          {simulateResult !== null ? (
            <div data-testid="policy-rule-wizard-simulate-result">
              <PolicySimulator result={simulateResult} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="mt-6 space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
        data-testid="policy-rule-wizard-step-publish"
      >
        <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Create or publish</h4>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Custom packs use the same versioned storage as bundled defaults (tenant-owned rows). Publish requires pack
          admin authority.
        </p>

        <label className={cn("flex max-w-prose items-start gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <input
            type="checkbox"
            checked={allowPublishWithoutTest}
            onChange={(e) => setAllowPublishWithoutTest(e.target.checked)}
            disabled={canPublishAfterTest}
          />
          <span>
            Allow publish without a successful in-wizard test (not recommended when the approval check would block).
          </span>
        </label>

        <div className="grid gap-2 max-w-xl sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="wizard-publish-name" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Pack name (create)
            </label>
            <Input
              id="wizard-publish-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              readOnly={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="wizard-publish-desc" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Description
            </label>
            <Input
              id="wizard-publish-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              readOnly={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
            />
          </div>
          <label className={cn("sm:col-span-2", OPERATOR_TYPOGRAPHY.body)}>
            Pack type
            <select
              value={packType}
              onChange={(e) => onPackTypeChange(e.target.value)}
              disabled={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
              className="block w-full p-2 mt-1"
            >
              {PACK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="wizard-publish-version" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Version label (publish)
            </label>
            <Input
              id="wizard-publish-version"
              value={publishVersion}
              onChange={(e) => onPublishVersionChange(e.target.value)}
              readOnly={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
            />
          </div>
        </div>

        {bundledPublishBlocked ? (
          <p
            id={POLICY_RULE_WIZARD_BUNDLED_PUBLISH_BLOCKED_HINT_ID}
            className={cn(
              "max-w-prose rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            role="note"
          >
            Bundled default packs cannot be republished from Policy packs. Copy JSON into a project custom pack to customize.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="policy-rule-wizard-create-pack"
            onClick={() => void onCreate()}
            disabled={loading || !canMutatePacks || parsedDocumentForSimulate === null}
            aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
          >
            Create pack
          </Button>
          <Button
            type="button"
            data-testid="policy-rule-wizard-publish-version"
            onClick={() => void onPublish()}
            disabled={publishDisabled}
            aria-describedby={
              bundledPublishBlocked ? POLICY_RULE_WIZARD_BUNDLED_PUBLISH_BLOCKED_HINT_ID : undefined
            }
          >
            Publish version
          </Button>
        </div>
      </div>
    </section>
  );
}
