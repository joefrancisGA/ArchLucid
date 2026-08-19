import type { ReactElement } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  ALERT_RULES_HOW_ALERTS_WORK,
  ALERT_RULES_PREVIEW_DRAFT_STATUS_LABEL,
  ALERT_RULES_PREVIEW_DRAFT_STATUS_TITLE,
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
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 id="alert-rule-preview-heading" className={cn("my-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {ALERT_RULES_PREVIEW_HEADING}
        </h3>
        <StatusTag
          kind="draft"
          label={ALERT_RULES_PREVIEW_DRAFT_STATUS_LABEL}
          title={ALERT_RULES_PREVIEW_DRAFT_STATUS_TITLE}
          data-testid="alert-rule-preview-draft-status"
        />
      </div>
      <p
        className={cn("mb-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="alert-rule-live-preview"
      >
        {preview}
      </p>
      <p className={cn("mb-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ALERT_RULES_HOW_ALERTS_WORK}
      </p>
    </aside>
  );
}
