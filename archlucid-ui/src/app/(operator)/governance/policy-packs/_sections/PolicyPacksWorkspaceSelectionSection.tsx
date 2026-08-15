"use client";

import { cn } from "@/lib/utils";
import { policyPackTypeBuyerDisplayLabel } from "@/lib/policy/policy-pack-type-label";
import { isStandardBaselinePolicyPackName } from "@/lib/policy/policy-pack-standard-baseline";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { StatusTag } from "@/components/ui/status-tag";
import type { PolicyPackWorkspaceSelectionItem } from "@/types/policy-packs";

export type PolicyPacksWorkspaceSelectionSectionProps = {
  readonly canMutatePacks: boolean;
  readonly items: PolicyPackWorkspaceSelectionItem[];
  readonly loading: boolean;
  readonly togglingAssignmentId: string | null;
  readonly onToggle: (assignmentId: string, nextEnabled: boolean) => void;
};

export function PolicyPacksWorkspaceSelectionSection(props: PolicyPacksWorkspaceSelectionSectionProps) {
  const { canMutatePacks, items, loading, togglingAssignmentId, onToggle } = props;

  return (
    <section className="mb-8" aria-labelledby="policy-packs-workspace-selection-heading">
      <h3 id="policy-packs-workspace-selection-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Workspace policy packs
      </h3>
      <p className={cn("mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        All bundled packs start selected for this workspace. Turn packs off when you do not want their rules applied to
        reviews here.
      </p>

      {loading && items.length === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading workspace packs…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No policy packs are available for this workspace.
        </p>
      ) : null}

      <ul className="divide-y rounded-md border" data-testid="policy-packs-workspace-selection-list">
        {items.map((item) => {
          const inputId = `policy-pack-selection-${item.assignmentId}`;
          const busy = togglingAssignmentId === item.assignmentId;

          return (
            <li key={item.assignmentId} className="px-3 py-3">
              <div className="flex items-start gap-3">
                <input
                  id={inputId}
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={item.isEnabled}
                  disabled={!canMutatePacks || busy || loading}
                  onChange={(event) => {
                    onToggle(item.assignmentId, event.target.checked);
                  }}
                  data-testid={`policy-pack-selection-${item.policyPackId}`}
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor={inputId} className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {item.name}
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {isStandardBaselinePolicyPackName(item.name) ? (
                      <StatusTag kind="ready" label="Standard baseline" />
                    ) : (
                      <StatusTag kind="neutral" label="Advanced / domain" />
                    )}
                    <StatusTag kind="neutral" label={policyPackTypeBuyerDisplayLabel(item.packType)} />
                    <StatusTag kind="neutral" label={`v${item.currentVersion}`} />
                  </div>
                  {item.description ? (
                    <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.description}</p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
