"use client";

import { ShortcutHint } from "@/components/ShortcutHint";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PageShortcutEntry } from "@/lib/shortcut-registry";
import { cn } from "@/lib/utils";

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
  const {
    shortcuts,
    shortcutsTestId,
    scopeStatusBadge,
    extraShortcutHints,
    showShortcutHints = true,
  } = props;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {scopeStatusBadge}
        <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
      </div>
      {shortcuts != null && shortcuts.length > 0 ? (
        <PageShortcutsDisclosure
          testId={shortcutsTestId}
          entries={shortcuts.map((entry) => ({
            id: entry.key,
            label: entry.label,
            description: entry.description,
          }))}
        />
      ) : null}
      {showShortcutHints ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <ShortcutHint shortcut="F1" /> page help; <ShortcutHint shortcut="Ctrl+K" /> search;
          {extraShortcutHints}
        </p>
      ) : null}
    </div>
  );
}
