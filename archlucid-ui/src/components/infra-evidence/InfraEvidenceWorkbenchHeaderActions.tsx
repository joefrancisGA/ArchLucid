"use client";

import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { ShortcutHint } from "@/components/ShortcutHint";
import type { PageShortcutEntry } from "@/lib/shortcut-registry";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type InfraEvidenceWorkbenchHeaderActionsProps = {
  readonly shortcutsTestId: string;
  readonly shortcuts?: readonly PageShortcutEntry[];
  readonly scopeStatusBadge?: React.ReactNode;
  readonly extraShortcutHints?: React.ReactNode;
  readonly showShortcutHints?: boolean;
  readonly contextualHelpTriggerText?: string;
};

export function InfraEvidenceWorkbenchHeaderActions(
  props: InfraEvidenceWorkbenchHeaderActionsProps,
): React.JSX.Element {
  const { scopeStatusBadge, extraShortcutHints, showShortcutHints = true, contextualHelpTriggerText } = props;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {scopeStatusBadge}
        <PageContextualHelpButton
          triggerText={contextualHelpTriggerText ?? PAGE_HELP_SHORT_TRIGGER_TEXT}
        />
      </div>
      {showShortcutHints ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search
          {extraShortcutHints}
        </p>
      ) : null}
    </div>
  );
}
