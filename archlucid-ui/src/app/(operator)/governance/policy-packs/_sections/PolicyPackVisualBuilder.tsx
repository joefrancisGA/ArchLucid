"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PolicySimulator } from "@/components/governance/PolicySimulator";
import { usePolicyPackRuleTemplatesQuery } from "@/hooks/use-policy-pack-rule-templates-query";
import { simulatePolicyPackAgainstRun } from "@/lib/api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { components } from "@/lib/openapi-schemas";
import {
  canAddNestedGroup,
  createEmptyVisualBuilderState,
  type PolicyPackRuleTemplate,
  tryParseVisualBuilderFromContentJson,
  VISUAL_CATEGORY_OPTIONS,
  VISUAL_SEVERITY_OPTIONS,
  type VisualBuilderState,
  type VisualConditionField,
  type VisualConditionNode,
  type VisualPredicateOperator,
  visualBuilderStateToContentJson,
} from "@/lib/policy/policy-pack-visual-builder";
import { presentPolicyPackSimulateToast } from "@/lib/policy/policy-pack-simulate-toast";
import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";
import { showSuccess } from "@/lib/toast";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type PolicyPackVisualBuilderProps = {
  readonly canMutatePacks: boolean;
  readonly policyContentJson: string;
  readonly onPolicyContentJsonSync: (json: string) => void;
  readonly selectedPackId: string;
  readonly scopedReviewId?: string;
  readonly onPickReview?: (reviewId: string) => void;
};

const FIELD_OPTIONS: VisualConditionField[] = [
  "finding.severity",
  "finding.category",
  "finding.message",
  "manifest.systemName",
  "manifest.environment",
];

const OPERATOR_OPTIONS: VisualPredicateOperator[] = [
  "equals",
  "notEquals",
  "contains",
  "startsWith",
  "endsWith",
  "severityAtLeast",
  "categoryIn",
];

function updateGroupChildren(
  node: VisualConditionNode,
  path: number[],
  updater: (children: VisualConditionNode[]) => VisualConditionNode[],
): VisualConditionNode {
  if (node.type !== "group") {
    return node;
  }

  if (path.length === 0) {
    return { ...node, children: updater(node.children) };
  }

  const [index, ...rest] = path;
  const nextChildren = node.children.map((child, childIndex) =>
    childIndex === index ? updateGroupChildren(child, rest, updater) : child,
  );

  return { ...node, children: nextChildren };
}

export function PolicyPackVisualBuilder(props: PolicyPackVisualBuilderProps) {
  const { canMutatePacks, policyContentJson, onPolicyContentJsonSync, selectedPackId } = props;
  const scopedReviewId = (props.scopedReviewId ?? "").trim();
  const scopedReviewFilterActive = scopedReviewId.length > 0;
  const requiresReviewPick = props.onPickReview !== undefined;
  const validateClearScopeHref = buildPolicyPacksHrefWithReviewId("");
  const [builderState, setBuilderState] = useState<VisualBuilderState>(() => createEmptyVisualBuilderState());
  const [jsonPreview, setJsonPreview] = useState<string>(policyContentJson);
  const [roundTripWarning, setRoundTripWarning] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const effectiveSimulateRunId = scopedReviewFilterActive ? scopedReviewId : "";
  const templatesQuery = usePolicyPackRuleTemplatesQuery();
  const templates = templatesQuery.data ?? [];
  const templatesError = templatesQuery.isError
    ? templatesQuery.error instanceof Error
      ? templatesQuery.error.message
      : "Network error loading rule templates."
    : null;
  const [simulateBusy, setSimulateBusy] = useState<boolean>(false);
  const [simulateFailure, setSimulateFailure] = useState<ApiLoadFailureState | null>(null);
  const [simulateResult, setSimulateResult] = useState<
    components["schemas"]["PolicyPackGovernanceDryRunResult"] | null
  >(null);

  useEffect(() => {
    const parsed = tryParseVisualBuilderFromContentJson(policyContentJson);
    setBuilderState(parsed.state);
    setJsonPreview(policyContentJson);
    setRoundTripWarning(parsed.warning);
  }, [selectedPackId, policyContentJson]);

  const syncFromBuilder = useCallback(
    (nextState: VisualBuilderState) => {
      const json = visualBuilderStateToContentJson(nextState, policyContentJson);
      setBuilderState(nextState);
      setJsonPreview(json);
      setRoundTripWarning(null);
      onPolicyContentJsonSync(json);
    },
    [onPolicyContentJsonSync, policyContentJson],
  );

  const groupedTemplates = useMemo(() => {
    const map = new Map<string, PolicyPackRuleTemplate[]>();

    for (const template of templates) {
      const bucket = map.get(template.category) ?? [];
      bucket.push(template);
      map.set(template.category, bucket);
    }

    return map;
  }, [templates]);

  function loadTemplate(template: PolicyPackRuleTemplate): void {
    setSelectedTemplateId(template.templateId);
    const parsed = tryParseVisualBuilderFromContentJson(template.contentJson);
    const nextState: VisualBuilderState = {
      ...parsed.state,
      templateId: template.templateId,
    };
    syncFromBuilder(nextState);
    showSuccess(`Loaded template “${template.displayName}”.`);
  }

  function addLeafCondition(): void {
    const leaf: VisualConditionNode = {
      type: "leaf",
      field: "finding.severity",
      operator: "severityAtLeast",
      value: "Medium",
    };

    const nextRoot = updateGroupChildren(builderState.root, [], (children) => [...children, leaf]);
    syncFromBuilder({ ...builderState, root: nextRoot });
  }

  function addGroupCondition(): void {
    if (!canAddNestedGroup(builderState.root)) {
      setRoundTripWarning("Maximum nesting depth (3) reached for condition groups.");
      return;
    }

    const group: VisualConditionNode = { type: "group", combinator: "and", children: [] };
    const nextRoot = updateGroupChildren(builderState.root, [], (children) => [...children, group]);
    syncFromBuilder({ ...builderState, root: nextRoot });
  }

  function onJsonPreviewEdit(value: string): void {
    setJsonPreview(value);
    const parsed = tryParseVisualBuilderFromContentJson(value);
    setBuilderState(parsed.state);
    setRoundTripWarning(parsed.warning);
    onPolicyContentJsonSync(value);
  }

  async function runSimulate(): Promise<void> {
    const trimmedRun = effectiveSimulateRunId.trim();

    if (trimmedRun.length === 0) {
      setSimulateFailure(uiFailureFromMessage("Pick a finalized review to validate this policy content."));
      return;
    }

    let content: components["schemas"]["PolicyPackContentDocument"];

    try {
      content = JSON.parse(jsonPreview) as components["schemas"]["PolicyPackContentDocument"];
    } catch {
      setSimulateFailure(uiFailureFromMessage("Fix JSON syntax before validating."));
      return;
    }

    setSimulateBusy(true);
    setSimulateFailure(null);

    try {
      const proposedId: string | null = /^[0-9a-fA-F-]{36}$/.test(selectedPackId) ? selectedPackId : null;
      const body: components["schemas"]["PolicyPackSimulateRequest"] = {
        runId: trimmedRun,
        content,
        blockCommitOnCritical: true,
        proposedPolicyPackId: proposedId,
      };
      const result = await simulatePolicyPackAgainstRun(body);
      setSimulateResult(result);
      presentPolicyPackSimulateToast(result);
    } catch (error: unknown) {
      setSimulateFailure(toApiLoadFailure(error));
    } finally {
      setSimulateBusy(false);
    }
  }

  return (
    <section aria-labelledby="visual-builder-heading" className="space-y-4 rounded-lg border border-border p-4">
      <h3 id="visual-builder-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Visual policy pack builder
      </h3>
      <p className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}>
        Pick a starter template, compose conditions, and keep JSON as the source of truth for simulate/publish.
      </p>

      {templatesError !== null ? (
        <p className={cn("text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {templatesError}
        </p>
      ) : null}

      {roundTripWarning !== null ? (
        <p
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          role="status"
        >
          {roundTripWarning}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3">
          <p className={cn("text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>Templates</p>
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-md border border-border p-2">
            {[...groupedTemplates.entries()].map(([category, items]) => (
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
                          selectedTemplateId === template.templateId && "bg-accent font-medium",
                        )}
                        onClick={() => loadTemplate(template)}
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

        <div className="space-y-3 lg:col-span-6">
          <p className={cn("text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>Conditions</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!canMutatePacks} onClick={addLeafCondition}>
              Add condition
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!canMutatePacks} onClick={addGroupCondition}>
              Add group
            </Button>
          </div>

          {builderState.root.type === "group" && builderState.root.children.length === 0 ? (
            <p className={cn("text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}>No conditions yet — add a leaf or load a template.</p>
          ) : null}

          {builderState.root.type === "group"
            ? builderState.root.children.map((child, index) =>
                child.type === "leaf" ? (
                  <div key={`leaf-${index}`} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <select
                      className={cn("rounded border border-input bg-background px-2 py-1", OPERATOR_TYPOGRAPHY.body)}
                      value={child.field}
                      disabled={!canMutatePacks}
                      onChange={(event) => {
                        const field = event.target.value as VisualConditionField;
                        const nextChildren = builderState.root.type === "group" ? [...builderState.root.children] : [];
                        nextChildren[index] = { ...child, field };
                        syncFromBuilder({
                          ...builderState,
                          root: { type: "group", combinator: "and", children: nextChildren },
                        });
                      }}
                    >
                      {FIELD_OPTIONS.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                    <select
                      className={cn("rounded border border-input bg-background px-2 py-1", OPERATOR_TYPOGRAPHY.body)}
                      value={child.operator}
                      disabled={!canMutatePacks}
                      onChange={(event) => {
                        const operator = event.target.value as VisualPredicateOperator;
                        const nextChildren = builderState.root.type === "group" ? [...builderState.root.children] : [];
                        nextChildren[index] = { ...child, operator };
                        syncFromBuilder({
                          ...builderState,
                          root: { type: "group", combinator: "and", children: nextChildren },
                        });
                      }}
                    >
                      {OPERATOR_OPTIONS.map((operator) => (
                        <option key={operator} value={operator}>
                          {operator}
                        </option>
                      ))}
                    </select>
                    {child.operator === "severityAtLeast" ? (
                      <select
                        className={cn("rounded border border-input bg-background px-2 py-1", OPERATOR_TYPOGRAPHY.body)}
                        value={child.value}
                        disabled={!canMutatePacks}
                        onChange={(event) => {
                          const nextChildren =
                            builderState.root.type === "group" ? [...builderState.root.children] : [];
                          nextChildren[index] = { ...child, value: event.target.value };
                          syncFromBuilder({
                            ...builderState,
                            root: { type: "group", combinator: "and", children: nextChildren },
                          });
                        }}
                      >
                        {VISUAL_SEVERITY_OPTIONS.map((severity) => (
                          <option key={severity} value={severity}>
                            {severity}
                          </option>
                        ))}
                      </select>
                    ) : child.operator === "categoryIn" ? (
                      <select
                        className={cn("rounded border border-input bg-background px-2 py-1", OPERATOR_TYPOGRAPHY.body)}
                        value={child.value}
                        disabled={!canMutatePacks}
                        onChange={(event) => {
                          const nextChildren =
                            builderState.root.type === "group" ? [...builderState.root.children] : [];
                          nextChildren[index] = { ...child, value: event.target.value };
                          syncFromBuilder({
                            ...builderState,
                            root: { type: "group", combinator: "and", children: nextChildren },
                          });
                        }}
                      >
                        {VISUAL_CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={child.value}
                        disabled={!canMutatePacks}
                        onChange={(event) => {
                          const nextChildren =
                            builderState.root.type === "group" ? [...builderState.root.children] : [];
                          nextChildren[index] = { ...child, value: event.target.value };
                          syncFromBuilder({
                            ...builderState,
                            root: { type: "group", combinator: "and", children: nextChildren },
                          });
                        }}
                      />
                    )}
                  </div>
                ) : null,
              )
            : null}

          <label className={cn("block text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>
            Compliance rule keys (comma-separated)
            <Input
              className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
              value={builderState.complianceRuleKeys.join(", ")}
              disabled={!canMutatePacks}
              onChange={(event) => {
                const keys = event.target.value
                  .split(",")
                  .map((part) => part.trim())
                  .filter((part) => part.length > 0);
                syncFromBuilder({ ...builderState, complianceRuleKeys: keys });
              }}
            />
          </label>
        </div>

        <div className="space-y-2 lg:col-span-3">
          <p className={cn("text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>Live JSON preview</p>
          <Textarea
            className={cn("min-h-80 font-mono", OPERATOR_TYPOGRAPHY.micro)}
            value={jsonPreview}
            disabled={!canMutatePacks}
            onChange={(event) => onJsonPreviewEdit(event.target.value)}
            data-testid="visual-builder-json-preview"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
        <div className="space-y-2">
          {!scopedReviewFilterActive && requiresReviewPick ? (
            <>
              <Label htmlFor="visual-builder-run-picker">Finalized review</Label>
              <div className="min-w-[16rem] max-w-xl">
                <AskRunIdPicker
                  value=""
                  onChange={(value) => {
                    if (value.trim().length > 0) {
                      props.onPickReview?.(value.trim());
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
          ) : scopedReviewFilterActive ? (
            <p
              className={cn("m-0 text-muted-foreground", OPERATOR_TYPOGRAPHY.body)}
              data-testid="visual-builder-run-scope-banner"
            >
              {"Validating policy content for review "}
              <span className="font-mono text-al-text-primary">{scopedReviewId}</span>
              {" · "}
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={validateClearScopeHref}>
                Clear review scope
              </Link>
              {" · "}
              <Link
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                href={`/architecture/reviews/${encodeURIComponent(scopedReviewId)}`}
              >
                Open review
              </Link>
            </p>
          ) : (
            <>
              <Label htmlFor="visual-builder-run-picker">Finalized review</Label>
              <div className="min-w-[16rem] max-w-xl">
                <AskRunIdPicker
                  value={scopedReviewId}
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
        <Button type="button" variant="primary" size="sm" disabled={!canMutatePacks || simulateBusy} onClick={() => void runSimulate()}>
          Validate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canMutatePacks}
          onClick={() => {
            onPolicyContentJsonSync(jsonPreview);
            showSuccess("Draft JSON synced for publish.");
          }}
        >
          Save draft
        </Button>
      </div>

      {simulateFailure !== null ? (
        <p className={cn("text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {simulateFailure.message}
        </p>
      ) : null}

      {simulateResult !== null ? <PolicySimulator result={simulateResult} /> : null}
    </section>
  );
}
