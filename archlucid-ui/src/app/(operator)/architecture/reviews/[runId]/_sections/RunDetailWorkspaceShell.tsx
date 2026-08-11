"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";

export type RunDetailWorkspaceLayoutProps = {
  readonly main: React.ReactNode;
  readonly rail: React.ReactNode | null;
  readonly stickyActions?: React.ReactNode;
};

/** Lightweight workspace grid — kept sync so deferred chrome chunks stay out of the entry graph. */
export function RunDetailWorkspaceLayout(props: RunDetailWorkspaceLayoutProps): React.JSX.Element {
  return (
    <div className={cn("space-y-4", OPERATOR_LAYOUT.sectionStack)} data-testid="run-detail-workspace-layout">
      {props.stickyActions !== null && props.stickyActions !== undefined ? (
        <div className="hidden lg:block">{props.stickyActions}</div>
      ) : null}
      <div
        className={cn(
          "grid gap-6",
          props.rail !== null ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-1",
        )}
        data-operator-side-rail-kind={props.rail !== null ? "working-object" : "none"}
      >
        <div className={cn("min-w-0 space-y-4", OPERATOR_LAYOUT.sectionStack)}>{props.main}</div>
        {props.rail !== null ? (
          <aside className="space-y-4" data-testid="run-detail-working-object-rail">
            <div className="space-y-4 lg:sticky lg:top-36">{props.rail}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

type RunDetailWorkspaceDisclosureContextValue = {
  readonly expandAll: () => void;
  readonly collapseAll: () => void;
};

const RunDetailWorkspaceDisclosureContext = createContext<RunDetailWorkspaceDisclosureContextValue | null>(null);

/** Client wrapper that toggles all `[data-workspace-disclosure]` details elements. */
export function RunDetailWorkspaceDisclosureProvider(props: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const [revision, setRevision] = useState(0);

  const expandAll = useCallback(() => {
    const nodes = document.querySelectorAll<HTMLDetailsElement>("details[data-workspace-disclosure]");

    for (const node of nodes) {
      node.open = true;
    }

    setRevision((value) => value + 1);
  }, []);

  const collapseAll = useCallback(() => {
    const nodes = document.querySelectorAll<HTMLDetailsElement>("details[data-workspace-disclosure]");

    for (const node of nodes) {
      node.open = false;
    }

    setRevision((value) => value + 1);
  }, []);

  const contextValue = useMemo(
    () => ({
      expandAll,
      collapseAll,
    }),
    [collapseAll, expandAll],
  );

  return (
    <RunDetailWorkspaceDisclosureContext.Provider value={contextValue}>
      <div data-workspace-disclosure-revision={revision}>{props.children}</div>
    </RunDetailWorkspaceDisclosureContext.Provider>
  );
}

/** Expand/collapse affordance for workspace `<details>` heroes — place adjacent to tabbed sections. */
export function RunDetailWorkspaceDisclosureControls(): React.JSX.Element | null {
  const context = useContext(RunDetailWorkspaceDisclosureContext);

  if (context === null) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center justify-end gap-2"
      data-testid="run-detail-disclosure-controls"
    >
      <Button type="button" variant="outline" size="sm" onClick={context.expandAll}>
        Expand all
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={context.collapseAll}>
        Collapse all
      </Button>
    </div>
  );
}
