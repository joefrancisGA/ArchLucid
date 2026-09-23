"use client";

import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export type InfraEvidenceWorkbenchHeaderActionsProps = {
  readonly shortcutsTestId: string;
  readonly shortcuts?: readonly PageShortcutEntry[];
  readonly scopeStatusBadge?: React.ReactNode;
  readonly extraShortcutHints?: React.ReactNode;
  readonly showShortcutHints?: boolean;
};

export function InfraEvidenceWorkbenchHeaderActions(
  props: InfraEvidenceWorkbenchHeaderActionsProps,
): React.JSX.Element {
  const { scopeStatusBadge } = props;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {scopeStatusBadge}
        <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
      </div>
    </div>
  );
}
