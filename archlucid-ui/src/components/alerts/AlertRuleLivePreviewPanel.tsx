import type { ReactElement } from "react";

import {
  ALERT_RULES_HOW_ALERTS_WORK,
  ALERT_RULES_PREVIEW_HEADING,
} from "@/lib/alert-rule-conditions-copy";
import { formatAlertRulePreview, type AlertRuleFormInput } from "@/lib/alert-rule-conditions";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AlertRuleLivePreviewPanelProps = {
  readonly form: AlertRuleFormInput;
};

export function AlertRuleLivePreviewPanel(props: AlertRuleLivePreviewPanelProps): ReactElement {
  const preview = formatAlertRulePreview(props.form);

  return (
    <aside
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-labelledby="alert-rule-preview-heading"
    >
      <h3 id="alert-rule-preview-heading" className={cn("mt-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {ALERT_RULES_PREVIEW_HEADING}
      </h3>
      <p
        className={cn("mb-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
        data-testid="alert-rule-live-preview"
      >
        {preview}
      </p>
      <p className={cn("mb-0 mt-3 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {ALERT_RULES_HOW_ALERTS_WORK}
      </p>
    </aside>
  );
}
