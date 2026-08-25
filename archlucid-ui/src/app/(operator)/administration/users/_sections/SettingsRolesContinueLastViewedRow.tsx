"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SettingsRolesContinueLastTarget } from "@/lib/resolve-continue-last-settings-principal";
import { cn } from "@/lib/utils";

export type SettingsRolesContinueLastViewedRowProps = {
  readonly target: SettingsRolesContinueLastTarget;
  readonly onOpen: (principalId: string) => void;
};

/** Pinned continue row for the most recently viewed users-directory principal. */
export function SettingsRolesContinueLastViewedRow(
  props: SettingsRolesContinueLastViewedRowProps,
): React.JSX.Element {
  return (
    <section
      aria-labelledby="settings-roles-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="settings-roles-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="settings-roles-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed principal
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.target.name}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="settings-roles-continue-last-viewed-open"
          onClick={() => {
            props.onOpen(props.target.principalId);
          }}
        >
          Open principal
        </Button>
      </div>
    </section>
  );
}
