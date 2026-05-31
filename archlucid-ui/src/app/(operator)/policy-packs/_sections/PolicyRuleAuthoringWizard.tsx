"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PolicyPackContentJsonEditor } from "@/components/PolicyPackContentJsonEditor";
import { Textarea } from "@/components/ui/textarea";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { PolicySimulator } from "@/components/governance/PolicySimulator";
import { listRunsByProjectPaged, simulatePolicyPackAgainstRun } from "@/lib/api";
import { draftPolicyPackRule } from "@/lib/api/policy-pack-draft-api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import {
  guidedFieldsFromContentDocument,
  type GuidedPolicyFields,
} from "@/lib/policy-pack-guided-content";
import {
  composePolicyPackContentForPublish,
  createEmptyCuratedRulesDocument,
  hydrateCuratedFromContentDocument,
  type CuratedRulesDocument,
  validateCuratedRulesDocument,
} from "@/lib/policy-pack-curated-rules-v1";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
import type { components } from "@/lib/openapi-schemas";
import type { PolicyPackContentDocument } from "@/types/policy-packs";
import { showSuccess } from "@/lib/toast";
import type { RunSummary } from "@/types/authority";

import { PACK_TYPES } from "./policy-packs-page-constants";
import { CuratedRulesAuthoringSection } from "./CuratedRulesAuthoringSection";
import { PolicyPackVisualBuilder } from "./PolicyPackVisualBuilder";

const AUTH_WIZARD_PROJECT_ID = "default";

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
};

type WizardStepId = 1 | 2 | 3;

function tryParseContentDocument(json: string): PolicyPackContentDocument | null {
  try {
    const parsed: unknown = JSON.parse(json);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as PolicyPackContentDocument;
  } catch {
    return null;
  }
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
  } = props;

  const [step, setStep] = useState<WizardStepId>(1);
  const [inputMode, setInputMode] = useState<"guided" | "visual" | "json">("guided");
  const [guidedFields, setGuidedFields] = useState<GuidedPolicyFields>(() => ({
    complianceRuleKeysText: "",
    alertRuleIdsText: "",
    compositeAlertRuleIdsText: "",
    metadataLinesText: "",
  }));
  const [curatedDoc, setCuratedDoc] = useState<CuratedRulesDocument>(() => createEmptyCuratedRulesDocument({}));
  const [authoringErrors, setAuthoringErrors] = useState<string[]>([]);

  useEffect(() => {
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

    setStep(1);

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

  const [simulateRunId, setSimulateRunId] = useState("");
  const [recentRuns, setRecentRuns] = useState<RunSummary[]>([]);
  const [runsLoadError, setRunsLoadError] = useState<string | null>(null);
  const [simulateBusy, setSimulateBusy] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState<ApiLoadFailureState | null>(null);
  const [simulateResult, setSimulateResult] =
    useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(null);
  const [blockOnCritical, setBlockOnCritical] = useState(true);
  const [allowPublishWithoutTest, setAllowPublishWithoutTest] = useState(false);
  const [draftIntent, setDraftIntent] = useState("");
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftFailure, setDraftFailure] = useState<ApiLoadFailureState | null>(null);
  const [draftResponse, setDraftResponse] = useState<{ disclaimer: string; draftRuleJson: string } | null>(null);

  const jsonEditorValue = policyContentJson;

  const mergeAuthoringIntoPolicyJson = useCallback(() => {
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

    onPolicyContentJsonSync(JSON.stringify(doc, null, 2));
  }, [curatedDoc, guidedFields, name, description, onPolicyContentJsonSync, packType, publishVersion]);

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
  }, [policyContentJson]);

  const loadRecentRuns = useCallback(async () => {
    setRunsLoadError(null);

    try {
      const raw: unknown = await listRunsByProjectPaged(AUTH_WIZARD_PROJECT_ID, 1, 30);
      const coerced = coerceRunSummaryPaged(raw);

      if (!coerced.ok) {
        setRecentRuns([]);
        setRunsLoadError(coerced.message);

        return;
      }

      setRecentRuns(coerced.value.items);
    } catch (e: unknown) {
      setRecentRuns([]);
      setRunsLoadError(toApiLoadFailure(e).message);
    }
  }, []);

  const parsedDocumentForSimulate: PolicyPackContentDocument | null = useMemo(
    () => tryParseContentDocument(policyContentJson),
    [policyContentJson],
  );

  const runSimulation = useCallback(async () => {
    setSimulateFailure(null);
    setSimulateResult(null);

    if (parsedDocumentForSimulate === null) {
      setSimulateFailure(
        uiFailureFromMessage("Policy content must be valid JSON matching the pack document shape before testing."),
      );

      return;
    }

    const trimmedRun: string = simulateRunId.trim();

    if (trimmedRun.length === 0) {
      setSimulateFailure(
        uiFailureFromMessage("Enter a run id to evaluate this policy content against that architecture snapshot."),
      );

      return;
    }

    setSimulateBusy(true);

    try {
      const proposedId: string | null = /^[0-9a-fA-F-]{36}$/.test(selectedPackId) ? selectedPackId : null;
      const body: components["schemas"]["PolicyPackSimulateRequest"] = {
        runId: trimmedRun,
        content: parsedDocumentForSimulate,
        blockCommitOnCritical: blockOnCritical,
        proposedPolicyPackId: proposedId,
      };

      const result: components["schemas"]["PolicyPackGovernanceDryRunResult"] =
        await simulatePolicyPackAgainstRun(body);
      setSimulateResult(result);
      showSuccess("Policy test completed for the selected run.");
    } catch (e: unknown) {
      setSimulateFailure(toApiLoadFailure(e));
    } finally {
      setSimulateBusy(false);
    }
  }, [blockOnCritical, parsedDocumentForSimulate, selectedPackId, simulateRunId]);

  const gateBlocked: boolean =
    simulateResult?.gateResult !== undefined && simulateResult.gateResult?.blocked === true;

  const canPublishAfterTest: boolean = simulateResult !== null && !gateBlocked;

  const step3PublishDisabled: boolean =
    !canMutatePacks ||
    loading ||
    bundledPublishBlocked ||
    parsedDocumentForSimulate === null ||
    (!canPublishAfterTest && !allowPublishWithoutTest);

  return (
    <section className="mb-8" aria-labelledby="policy-rule-authoring-wizard-heading">
      <h3 id="policy-rule-authoring-wizard-heading" className="mt-0">
        Rule authoring wizard
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
        Design custom policy content, evaluate it against a committed architecture run (golden snapshot lineage), then
        create or publish through the same durable policy-pack versioning as platform defaults.
      </p>

      <ol className="mt-4 flex flex-wrap gap-3 text-sm" aria-label="Wizard steps">
        <li>
          <Button
            type="button"
            size="sm"
            variant={step === 1 ? "default" : "secondary"}
            onClick={() => setStep(1)}
          >
            1 — Design
          </Button>
        </li>
        <li>
          <Button
            type="button"
            size="sm"
            variant={step === 2 ? "default" : "secondary"}
            onClick={() => setStep(2)}
          >
            2 — Test on run
          </Button>
        </li>
        <li>
          <Button
            type="button"
            size="sm"
            variant={step === 3 ? "default" : "secondary"}
            onClick={() => setStep(3)}
          >
            3 — Publish
          </Button>
        </li>
      </ol>

      {step === 1 ? (
        <div className="mt-4 space-y-4 max-w-3xl" data-testid="policy-rule-wizard-step-design">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={inputMode === "guided" ? "default" : "secondary"}
              onClick={() => setInputMode("guided")}
            >
              Guided fields
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "visual" ? "default" : "secondary"}
              onClick={() => setInputMode("visual")}
              data-testid="policy-rule-wizard-visual-tab"
            >
              Visual builder
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "json" ? "default" : "secondary"}
              onClick={() => setInputMode("json")}
            >
              Raw JSON
            </Button>
          </div>

          <div
            className="rounded-md border border-dashed border-neutral-300 bg-al-surface-raised p-4 dark:border-neutral-700"
            data-testid="policy-pack-ai-draft-panel"
          >
            <p className="m-0 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Draft a rule from plain English
            </p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
              Describe governance intent in natural language; review the AI draft beside the curated rule schema before
              merging into your pack.
            </p>
            <Textarea
              className="mt-3 font-sans text-sm"
              rows={4}
              value={draftIntent}
              onChange={(e) => setDraftIntent(e.target.value)}
              disabled={!canMutatePacks || draftBusy}
              placeholder="Example: Encrypt all PHI at rest with customer-managed keys and require audit logging on every override."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={!canMutatePacks || draftBusy || draftIntent.trim().length < 20}
                onClick={() => {
                  void (async () => {
                    setDraftBusy(true);
                    setDraftFailure(null);

                    try {
                      const response = await draftPolicyPackRule({ freeTextIntent: draftIntent.trim() });
                      setDraftResponse(response);
                    } catch (e: unknown) {
                      setDraftResponse(null);
                      setDraftFailure(toApiLoadFailure(e));
                    } finally {
                      setDraftBusy(false);
                    }
                  })();
                }}
              >
                {draftBusy ? "Drafting…" : "✨ Draft a rule from plain English"}
              </Button>
            </div>
            {draftFailure !== null ? (
              <div className="mt-3" role="alert">
                <OperatorApiProblem failure={draftFailure} />
              </div>
            ) : null}
            {draftResponse !== null ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    Schema reference
                  </p>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-neutral-200 bg-white p-3 text-xs dark:border-neutral-700 dark:bg-neutral-950">
                    {`{
  "id": "kebab-case-id",
  "title": "string",
  "description": "string",
  "severity": "Critical|High|Medium|Low",
  "remediationGuidance": "string",
  "evidenceHints": ["manifest paths"],
  "frameworkMappings": [{ "framework": "", "requirement": "" }],
  "priority": "P0|P1|P2"
}`}
                  </pre>
                </div>
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    AI draft (review required)
                  </p>
                  <p className="mt-1 text-xs text-amber-900 dark:text-amber-100">{draftResponse.disclaimer}</p>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-3 text-xs">
                    {draftResponse.draftRuleJson}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>

          {inputMode === "visual" ? (
            <PolicyPackVisualBuilder
              canMutatePacks={canMutatePacks}
              policyContentJson={policyContentJson}
              onPolicyContentJsonSync={onPolicyContentJsonSync}
              selectedPackId={selectedPackId}
            />
          ) : inputMode === "guided" ? (
            <div className="grid gap-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Map compliance rule keys and optional alert hooks; metadata lines use{" "}
                <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">key=value</code> per line.
              </p>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-keys" className="text-sm font-medium">
                  Compliance rule keys
                </label>
                <Textarea
                  id="wizard-guided-keys"
                  value={guidedFields.complianceRuleKeysText}
                  onChange={(e) =>
                    setGuidedFields((f) => ({ ...f, complianceRuleKeysText: e.target.value }))
                  }
                  rows={5}
                  className="font-mono text-xs"
                  placeholder={"pci.segmentation.boundary-enforced"}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-alerts" className="text-sm font-medium">
                  Alert rule ids (optional)
                </label>
                <Textarea
                  id="wizard-guided-alerts"
                  value={guidedFields.alertRuleIdsText}
                  onChange={(e) =>
                    setGuidedFields((f) => ({ ...f, alertRuleIdsText: e.target.value }))
                  }
                  rows={2}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-composite" className="text-sm font-medium">
                  Composite alert rule ids (optional)
                </label>
                <Textarea
                  id="wizard-guided-composite"
                  value={guidedFields.compositeAlertRuleIdsText}
                  onChange={(e) =>
                    setGuidedFields((f) => ({ ...f, compositeAlertRuleIdsText: e.target.value }))
                  }
                  rows={2}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="wizard-guided-meta" className="text-sm font-medium">
                  Metadata (optional)
                </label>
                <Textarea
                  id="wizard-guided-meta"
                  value={guidedFields.metadataLinesText}
                  onChange={(e) =>
                    setGuidedFields((f) => ({ ...f, metadataLinesText: e.target.value }))
                  }
                  rows={2}
                  className="font-mono text-xs"
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
                <div role="alert" className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-2 text-xs">
                  <p className="font-medium m-0 mb-1">Fix before merging</p>
                  <ul className="list-disc ml-4 m-0">
                    {authoringErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" data-testid="policy-rule-wizard-merge-authoring" onClick={() => mergeAuthoringIntoPolicyJson()}>
                  Merge guided + curated rules into policy JSON
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => syncGuidedFromCurrentJson()}>
                  Load guided fields from current JSON
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <PolicyPackContentJsonEditor
                id="wizard-raw-json"
                label="Policy pack content document (JSON)"
                testId="policy-rule-wizard-raw-json"
                value={jsonEditorValue}
                onChange={onPolicyContentJsonSync}
                rows={14}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              />
              {!canMutatePacks ? (
                <p className="text-xs text-neutral-500">Reader tier: JSON edits are disabled.</p>
              ) : null}
            </div>
          )}

          <Button type="button" size="sm" variant="secondary" onClick={() => setStep(2)}>
            Next: test on run
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-4 space-y-4 max-w-3xl" data-testid="policy-rule-wizard-step-test">
          {parsedDocumentForSimulate === null ? (
            <p className="text-sm text-amber-800 dark:text-amber-200" role="status">
              Fix invalid policy JSON on step 1 (raw mode) or merge guided fields before running a test.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <label htmlFor="wizard-run-id" className="text-sm font-medium">
                Architecture run id
              </label>
              <Input
                id="wizard-run-id"
                data-testid="policy-rule-wizard-run-id"
                value={simulateRunId}
                onChange={(e) => setSimulateRunId(e.target.value)}
                className="w-72 font-mono text-xs"
              />
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => void loadRecentRuns()}>
              Load recent runs
            </Button>
          </div>

          {runsLoadError !== null ? (
            <p className="text-xs text-amber-800 dark:text-amber-200">{runsLoadError}</p>
          ) : null}

          {recentRuns.length > 0 ? (
            <label className="block text-sm">
              Pick a recent run
              <select
                className="block mt-1 p-2 w-full max-w-xl"
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={blockOnCritical}
              onChange={(e) => setBlockOnCritical(e.target.checked)}
            />
            Treat critical findings as blocking (pre-commit semantics)
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => void runSimulation()}
              disabled={simulateBusy || parsedDocumentForSimulate === null}
            >
              {simulateBusy ? "Testing…" : "Run policy test"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setStep(3)}>
              Next: publish
            </Button>
          </div>

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
      ) : null}

      {step === 3 ? (
        <div className="mt-4 space-y-4 max-w-3xl" data-testid="policy-rule-wizard-step-publish">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Custom packs use the same versioned storage as bundled defaults (tenant-owned rows). Publish requires pack admin
            authority.
          </p>

          <label className="flex items-start gap-2 text-sm max-w-prose">
            <input
              type="checkbox"
              checked={allowPublishWithoutTest}
              onChange={(e) => setAllowPublishWithoutTest(e.target.checked)}
              disabled={canPublishAfterTest}
            />
            <span>
              Allow publish without a successful in-wizard test (not recommended when the pre-commit gate would block).
            </span>
          </label>

          <div className="grid gap-2 max-w-xl">
            <div className="space-y-1">
              <label htmlFor="wizard-publish-name" className="text-sm font-medium">
                Pack name (create)
              </label>
              <Input
                id="wizard-publish-name"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="wizard-publish-desc" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="wizard-publish-desc"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              />
            </div>
            <label>
              Pack type
              <select
                value={packType}
                onChange={(e) => onPackTypeChange(e.target.value)}
                disabled={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
                className="block w-full p-2 mt-1"
              >
                {PACK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1">
              <label htmlFor="wizard-publish-version" className="text-sm font-medium">
                Version label (publish)
              </label>
              <Input
                id="wizard-publish-version"
                value={publishVersion}
                onChange={(e) => onPublishVersionChange(e.target.value)}
                readOnly={!canMutatePacks}
                title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              data-testid="policy-rule-wizard-create-pack"
              onClick={() => void onCreate()}
              disabled={loading || !canMutatePacks || parsedDocumentForSimulate === null}
              title={canMutatePacks ? undefined : enterpriseMutationControlDisabledTitle}
            >
              Create pack
            </Button>
            <Button
              type="button"
              data-testid="policy-rule-wizard-publish-version"
              onClick={() => void onPublish()}
              disabled={step3PublishDisabled}
              title={
                bundledPublishBlocked
                  ? "Bundled default packs cannot be republished from Policy packs."
                  : undefined
              }
            >
              Publish version
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}

    </section>
  );
}
