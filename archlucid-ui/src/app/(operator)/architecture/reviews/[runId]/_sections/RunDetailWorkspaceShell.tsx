"use client";

import { useCallback, useState } from "react";

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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className={cn("min-w-0 space-y-4", OPERATOR_LAYOUT.sectionStack)}>{props.main}</div>
        {props.rail !== null ? (
          <aside className="space-y-4">
            <div className="space-y-4 lg:sticky lg:top-36">{props.rail}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export type RunDetailWorkspaceDisclosureControlsProps = {
  readonly onExpandAll: () => void;
  readonly onCollapseAll: () => void;
};

export function RunDetailWorkspaceDisclosureControls(
  props: RunDetailWorkspaceDisclosureControlsProps,
): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="run-detail-disclosure-controls">
      <Button type="button" variant="ghost" size="sm" onClick={props.onExpandAll}>
        Expand all
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={props.onCollapseAll}>
        Collapse all
      </Button>
    </div>
  );
}

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

  return (
    <div data-workspace-disclosure-revision={revision}>
      <RunDetailWorkspaceDisclosureControls onExpandAll={expandAll} onCollapseAll={collapseAll} />
      {props.children}
    </div>
  );
}
