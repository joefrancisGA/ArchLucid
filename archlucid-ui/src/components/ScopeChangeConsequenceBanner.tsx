"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type JSX } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import {
  buildScopeChangeConsequenceBanner,
  buildScopeChangeEventKey,
  dismissScopeChangeConsequence,
  isScopeChangeConsequenceDismissed,
  type ScopeChangeConsequenceBannerModel,
} from "@/lib/scope-change-consequence-banner";
import { cn } from "@/lib/utils";

export type ScopeChangeConsequenceBannerProps = {
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildScopeChangeConsequenceBanner}. */
  readonly model?: ScopeChangeConsequenceBannerModel;
};

/**
 * TB-2288 — Mid-session banner after tenant/workspace/project switch.
 * Listens for {@link ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT}; dismissible per change event.
 * Distinct from first-open coach (TB-2234).
 */
export function ScopeChangeConsequenceBanner(
  props: ScopeChangeConsequenceBannerProps,
): JSX.Element | null {
  const pathname = usePathname();
  const model = props.model ?? buildScopeChangeConsequenceBanner();
  const [eventKey, setEventKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onScopeChanged = (): void => {
      const record = readOperatorScopeFromStorage();
      const nextKey = buildScopeChangeEventKey(record);

      if (isScopeChangeConsequenceDismissed(nextKey)) {
        setEventKey(null);

        return;
      }

      setEventKey(nextKey);
    };

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, []);

  const onDismiss = useCallback(() => {
    if (eventKey === null) {
      return;
    }

    dismissScopeChangeConsequence(eventKey);
    setEventKey(null);
  }, [eventKey]);

  if (pathname.startsWith("/help/")) {
    return null;
  }

  if (eventKey === null) {
    return null;
  }

  return (
    <aside
      className={cn(
        "mb-4 space-y-1 rounded-md border border-neutral-200 bg-neutral-50/90 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/50",
        props.className,
      )}
      role="status"
      aria-labelledby="scope-change-consequence-banner-heading"
      data-testid="scope-change-consequence-banner"
      data-event-key={eventKey}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          id="scope-change-consequence-banner-heading"
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {model.heading}
        </p>
        <DismissControl
          className="shrink-0"
          label={model.dismissLabel}
          data-testid="scope-change-consequence-banner-dismiss"
          onDismiss={onDismiss}
        />
      </div>
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{model.lead}</p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="scope-change-consequence-banner-honesty"
      >
        {model.honesty}
      </p>
    </aside>
  );
}
