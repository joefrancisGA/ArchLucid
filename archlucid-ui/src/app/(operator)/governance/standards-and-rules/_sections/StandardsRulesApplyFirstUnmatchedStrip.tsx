"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { StandardsRuleRow } from "@/lib/standards-rules-rows";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_standards_rules_apply_first_unmatched_strip_dismissed_v1";

export type StandardsRulesApplyFirstUnmatchedStripProps = {
  readonly target: StandardsRuleRow;
  readonly onApplyFilter: () => void;
};

/** Dismissible strip routing operators to the first rule without linked findings. */
export function StandardsRulesApplyFirstUnmatchedStrip(
  props: StandardsRulesApplyFirstUnmatchedStripProps,
): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  const scrollToRule = useCallback((): void => {
    document
      .querySelector(`[data-standards-rule-key="${props.target.ruleKey}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [props.target.ruleKey]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="standards-rules-apply-first-unmatched-strip"
      role="note"
    >
      <div className="min-w-0 flex-1">
        <p className="m-0 font-medium text-al-text-primary">Start with the first unmatched rule</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">{props.target.ruleName}</span> has no linked findings yet.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="standards-rules-apply-first-unmatched-open"
          onClick={scrollToRule}
        >
          Open rule
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="standards-rules-apply-first-unmatched-filter"
          onClick={() => {
            props.onApplyFilter();
            scrollToRule();
          }}
        >
          Show unmatched
        </Button>
        <DismissControl className="h-7" onDismiss={onDismiss} />
      </div>
    </div>
  );
}
