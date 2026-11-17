"use client";

import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_REVIEWER_PROCUREMENT_CHECKLIST_ITEMS,
  type SecureNowReviewerProcurementChecklistItemId,
  readSecureNowReviewerProcurementChecklist,
  writeSecureNowReviewerProcurementChecklist,
} from "@/lib/product-line/securenow-reviewer-procurement-checklist";
import { cn } from "@/lib/utils";

/** Workspace-local procurement readiness — not commerce authorization. */
export function SecureNowReviewerProcurementChecklist(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Record<SecureNowReviewerProcurementChecklistItemId, boolean>>(() =>
    readSecureNowReviewerProcurementChecklist(scope.workspaceId),
  );

  useEffect(() => {
    setReady(true);
    setState(readSecureNowReviewerProcurementChecklist(scope.workspaceId));
  }, [scope.workspaceId]);

  function toggle(itemId: SecureNowReviewerProcurementChecklistItemId): void {
    const next = { ...state, [itemId]: !state[itemId] };
    setState(next);
    writeSecureNowReviewerProcurementChecklist(scope.workspaceId, next);
  }

  if (!ready) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-reviewer-procurement-checklist-loading">
        Loading procurement checklist…
      </p>
    );
  }

  return (
    <section aria-labelledby="securenow-reviewer-procurement-checklist-heading" className="space-y-2">
      <h2 id="securenow-reviewer-procurement-checklist-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
        Procurement checklist (workspace)
      </h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Mark what your evaluator already has. Stored for this workspace in this browser only. Fees stay off this page.
      </p>
      <ul className="m-0 list-none space-y-2 p-0" data-testid="securenow-reviewer-procurement-checklist">
        {SECURENOW_REVIEWER_PROCUREMENT_CHECKLIST_ITEMS.map((item) => (
          <li key={item.id} className="flex items-baseline gap-2">
            <label className={cn("flex cursor-pointer items-baseline gap-2", OPERATOR_TYPOGRAPHY.body)}>
              <input
                type="checkbox"
                checked={state[item.id]}
                onChange={() => toggle(item.id)}
                data-testid={`securenow-reviewer-procurement-check-${item.id}`}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
