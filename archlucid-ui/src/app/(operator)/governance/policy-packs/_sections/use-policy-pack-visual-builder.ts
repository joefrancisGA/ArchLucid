"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  type VisualBuilderState,
  type VisualConditionNode,
  visualBuilderStateToContentJson,
} from "@/lib/policy/policy-pack-visual-builder";
import { presentPolicyPackSimulateToast } from "@/lib/policy/policy-pack-simulate-toast";
import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";
import { showSuccess } from "@/lib/toast";

export type PolicyPackVisualBuilderProps = {
  readonly canMutatePacks: boolean;
  readonly policyContentJson: string;
  readonly onPolicyContentJsonSync: (json: string) => void;
  readonly selectedPackId: string;
  readonly scopedReviewId?: string;
  readonly onPickReview?: (reviewId: string) => void;
};

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

export function usePolicyPackVisualBuilder(props: PolicyPackVisualBuilderProps) {
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

  return {
    canMutatePacks,
    scopedReviewId,
    scopedReviewFilterActive,
    requiresReviewPick,
    validateClearScopeHref,
    onPickReview: props.onPickReview,
    onPolicyContentJsonSync,
    builderState,
    jsonPreview,
    roundTripWarning,
    selectedTemplateId,
    templatesError,
    groupedTemplates,
    simulateBusy,
    simulateFailure,
    simulateResult,
    loadTemplate,
    addLeafCondition,
    addGroupCondition,
    onJsonPreviewEdit,
    runSimulate,
    syncFromBuilder,
  };
}
