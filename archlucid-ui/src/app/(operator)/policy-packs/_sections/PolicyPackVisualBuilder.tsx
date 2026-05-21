"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PolicySimulator } from "@/components/governance/PolicySimulator";
import { listRunsByProjectPaged, simulatePolicyPackAgainstRun } from "@/lib/api";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { coerceRunSummaryPaged } from "@/lib/operator-response-guards";
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
} from "@/lib/policy-pack-visual-builder";
import { showSuccess } from "@/lib/toast";

export type PolicyPackVisualBuilderProps = {
  readonly canMutatePacks: boolean;
  readonly policyContentJson: string;
  readonly onPolicyContentJsonSync: (json: string) => void;
  readonly selectedPackId: string;
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
  const [templates, setTemplates] = useState<PolicyPackRuleTemplate[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [builderState, setBuilderState] = useState<VisualBuilderState>(() => createEmptyVisualBuilderState());
  const [jsonPreview, setJsonPreview] = useState<string>(policyContentJson);
  const [roundTripWarning, setRoundTripWarning] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [simulateRunId, setSimulateRunId] = useState<string>("");
  const [simulateBusy, setSimulateBusy] = useState<boolean>(false);
  const [simulateFailure, setSimulateFailure] = useState<ApiLoadFailureState | null>(null);
  const [simulateResult, setSimulateResult] = useState<
    components["schemas"]["PolicyPackGovernanceDryRunResult"] | null
  >(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/proxy/v1/policy-packs/rule-templates", {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          setTemplatesError(`Could not load templates (${res.status}).`);
          return;
        }

        const body = (await res.json()) as PolicyPackRuleTemplate[];
        setTemplates(body);
        setTemplatesError(null);
      } catch {
        setTemplatesError("Network error loading rule templates.");
      }
    })();
  }, []);

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
    const trimmedRun = simulateRunId.trim();

    if (trimmedRun.length === 0) {
      setSimulateFailure(uiFailureFromMessage("Enter a run id to validate this policy content."));
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
      showSuccess("Policy validation completed.");
    } catch (error: unknown) {
      setSimulateFailure(toApiLoadFailure(error));
    } finally {
      setSimulateBusy(false);
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const page = coerceRunSummaryPaged(await listRunsByProjectPaged("default", 1, 1));
        const first = page.items[0];

        if (first?.runId && simulateRunId.trim().length === 0) {
          setSimulateRunId(first.runId);
        }
      } catch {
        // Optional default run id — operator can paste manually.
      }
    })();
  }, [simulateRunId]);

  return (
    <section aria-labelledby="visual-builder-heading" className="space-y-4 rounded-lg border border-border p-4">
      <h3 id="visual-builder-heading" className="text-base font-semibold">
        Visual policy pack builder
      </h3>
      <p className="text-sm text-muted-foreground">
        Pick a starter template, compose conditions, and keep JSON as the source of truth for simulate/publish.
      </p>

      {templatesError !== null ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {templatesError}
        </p>
      ) : null}

      {roundTripWarning !== null ? (
        <p
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50"
          role="status"
        >
          {roundTripWarning}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Templates</p>
          <div className="max-h-80 space-y-3 overflow-y-auto rounded-md border border-border p-2">
            {[...groupedTemplates.entries()].map(([category, items]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground">{category}</p>
                <ul className="mt-1 space-y-1">
                  {items.map((template) => (
                    <li key={template.templateId}>
                      <button
                        type="button"
                        className={`w-full rounded px-2 py-1 text-left text-sm hover:bg-accent ${
                          selectedTemplateId === template.templateId ? "bg-accent font-medium" : ""
                        }`}
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conditions</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!canMutatePacks} onClick={addLeafCondition}>
              Add condition
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!canMutatePacks} onClick={addGroupCondition}>
              Add group
            </Button>
          </div>

          {builderState.root.type === "group" && builderState.root.children.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conditions yet — add a leaf or load a template.</p>
          ) : null}

          {builderState.root.type === "group"
            ? builderState.root.children.map((child, index) =>
                child.type === "leaf" ? (
                  <div key={`leaf-${index}`} className="grid gap-2 rounded border border-border p-3 sm:grid-cols-3">
                    <select
                      className="rounded border border-input bg-background px-2 py-1 text-sm"
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
                      className="rounded border border-input bg-background px-2 py-1 text-sm"
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
                        className="rounded border border-input bg-background px-2 py-1 text-sm"
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
                        className="rounded border border-input bg-background px-2 py-1 text-sm"
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

          <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Compliance rule keys (comma-separated)
            <Input
              className="mt-1 font-mono text-sm"
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live JSON preview</p>
          <Textarea
            className="min-h-80 font-mono text-xs"
            value={jsonPreview}
            disabled={!canMutatePacks}
            onChange={(event) => onJsonPreviewEdit(event.target.value)}
            data-testid="visual-builder-json-preview"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
        <label className="text-sm">
          Run id for validate
          <Input
            className="mt-1 w-72 font-mono text-xs"
            value={simulateRunId}
            onChange={(event) => setSimulateRunId(event.target.value)}
          />
        </label>
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
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {simulateFailure.message}
        </p>
      ) : null}

      {simulateResult !== null ? <PolicySimulator result={simulateResult} /> : null}
    </section>
  );
}
