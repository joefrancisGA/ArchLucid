"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VISUAL_CATEGORY_OPTIONS,
  VISUAL_SEVERITY_OPTIONS,
  type VisualBuilderState,
  type VisualConditionField,
  type VisualConditionNode,
  type VisualPredicateOperator,
} from "@/lib/policy/policy-pack-visual-builder";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

export type PolicyPackVisualConditionEditorProps = {
  readonly canMutatePacks: boolean;
  readonly builderState: VisualBuilderState;
  readonly syncFromBuilder: (nextState: VisualBuilderState) => void;
  readonly onAddLeafCondition: () => void;
  readonly onAddGroupCondition: () => void;
};

export function PolicyPackVisualConditionEditor(props: PolicyPackVisualConditionEditorProps): React.ReactElement {
  const { canMutatePacks, builderState, syncFromBuilder, onAddLeafCondition, onAddGroupCondition } = props;

  return (
    <div className="space-y-3 lg:col-span-6">
      <p className={cn("text-muted-foreground", OPERATOR_NAV_GROUP_LABEL)}>Conditions</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!canMutatePacks} onClick={onAddLeafCondition}>
          Add condition
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!canMutatePacks} onClick={onAddGroupCondition}>
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
  );
}
