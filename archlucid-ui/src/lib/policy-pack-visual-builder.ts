import type { PolicyPackContentDocument } from "@/types/policy-packs";

export type VisualPredicateOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "severityAtLeast"
  | "categoryIn";

export type VisualConditionField =
  | "finding.severity"
  | "finding.category"
  | "finding.message"
  | "manifest.systemName"
  | "manifest.environment";

export type VisualConditionNode =
  | {
      readonly type: "group";
      readonly combinator: "and" | "or";
      readonly children: VisualConditionNode[];
    }
  | {
      readonly type: "leaf";
      readonly field: VisualConditionField;
      readonly operator: VisualPredicateOperator;
      readonly value: string;
    };

export type PolicyPackRuleTemplate = {
  readonly templateId: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: string;
  readonly contentJson: string;
};

export type VisualBuilderState = {
  readonly templateId: string | null;
  readonly root: VisualConditionNode;
  readonly complianceRuleKeys: string[];
  readonly advisoryDefaults: Record<string, string>;
  readonly metadata: Record<string, string>;
};

export const VISUAL_SEVERITY_OPTIONS = ["Low", "Medium", "High", "Critical"] as const;

export const VISUAL_CATEGORY_OPTIONS = [
  "Security",
  "Reliability",
  "Cost",
  "Compliance",
  "Performance",
  "Operations",
] as const;

export function createEmptyVisualBuilderState(): VisualBuilderState {
  return {
    templateId: null,
    root: { type: "group", combinator: "and", children: [] },
    complianceRuleKeys: [],
    advisoryDefaults: {},
    metadata: {},
  };
}

function parseContentDocument(json: string): PolicyPackContentDocument | null {
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

/** Maps visual builder state to PolicyPackContentDocument JSON (source of truth for save/simulate). */
export function visualBuilderStateToContentJson(state: VisualBuilderState, baseJson?: string): string {
  const base = baseJson !== undefined ? parseContentDocument(baseJson) : null;
  const doc: PolicyPackContentDocument = base ?? {
    complianceRuleIds: [],
    complianceRuleKeys: [],
    alertRuleIds: [],
    compositeAlertRuleIds: [],
    advisoryDefaults: {},
    metadata: {},
  };

  doc.complianceRuleKeys = [...state.complianceRuleKeys];
  doc.advisoryDefaults = { ...state.advisoryDefaults, ...conditionsToAdvisoryDefaults(state.root) };
  doc.metadata = {
    ...doc.metadata,
    ...state.metadata,
    "visualBuilder.predicateTree": JSON.stringify(state.root),
  };

  return JSON.stringify(doc, null, 2);
}

function conditionsToAdvisoryDefaults(root: VisualConditionNode): Record<string, string> {
  const defaults: Record<string, string> = {};

  if (root.type !== "group") {
    return defaults;
  }

  for (const child of root.children) {
    if (child.type !== "leaf") {
      continue;
    }

    if (child.field === "finding.severity" && child.operator === "severityAtLeast") {
      defaults.severityFloor = child.value;
    }

    if (child.field === "finding.category" && child.operator === "categoryIn") {
      defaults.categoryFilter = child.value;
    }

    if (child.field.startsWith("manifest.")) {
      const key = child.field.replace("manifest.", "manifest.");
      defaults[key] = child.value;
    }
  }

  return defaults;
}

/** Attempts to round-trip JSON edits back into visual builder state. Returns warning when unsupported. */
export function tryParseVisualBuilderFromContentJson(json: string): {
  readonly state: VisualBuilderState;
  readonly warning: string | null;
} {
  const doc = parseContentDocument(json);

  if (doc === null) {
    return { state: createEmptyVisualBuilderState(), warning: "JSON is not a valid policy pack document." };
  }

  let root: VisualConditionNode = { type: "group", combinator: "and", children: [] };
  let warning: string | null = null;

  const treeRaw = doc.metadata?.["visualBuilder.predicateTree"];

  if (typeof treeRaw === "string" && treeRaw.trim().length > 0) {
    try {
      root = JSON.parse(treeRaw) as VisualConditionNode;
    } catch {
      warning = "Hand-edited predicate tree could not be loaded into the visual builder.";
    }
  } else if (Object.keys(doc.advisoryDefaults ?? {}).length > 0) {
    warning = "Advisory defaults were edited without a visual predicate tree; showing JSON-derived hints only.";
    root = advisoryDefaultsToConditions(doc.advisoryDefaults ?? {});
  }

  return {
    state: {
      templateId: typeof doc.metadata?.templateId === "string" ? doc.metadata.templateId : null,
      root,
      complianceRuleKeys: [...(doc.complianceRuleKeys ?? [])],
      advisoryDefaults: { ...(doc.advisoryDefaults ?? {}) },
      metadata: { ...(doc.metadata ?? {}) },
    },
    warning,
  };
}

function advisoryDefaultsToConditions(defaults: Record<string, string>): VisualConditionNode {
  const children: VisualConditionNode[] = [];

  if (defaults.severityFloor) {
    children.push({
      type: "leaf",
      field: "finding.severity",
      operator: "severityAtLeast",
      value: defaults.severityFloor,
    });
  }

  if (defaults.categoryFilter) {
    children.push({
      type: "leaf",
      field: "finding.category",
      operator: "categoryIn",
      value: defaults.categoryFilter,
    });
  }

  return { type: "group", combinator: "and", children };
}

export function countGroupDepth(node: VisualConditionNode, depth = 0): number {
  if (node.type !== "group") {
    return depth;
  }

  if (node.children.length === 0) {
    return depth + 1;
  }

  return Math.max(...node.children.map((child) => countGroupDepth(child, depth + 1)));
}

export function canAddNestedGroup(node: VisualConditionNode): boolean {
  return countGroupDepth(node) < 3;
}
