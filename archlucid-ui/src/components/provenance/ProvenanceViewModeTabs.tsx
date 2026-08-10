"use client";

import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";

export type ProvenanceViewMode = "graph" | "timeline" | "table";

export type ProvenanceViewModeOption = {
  readonly id: ProvenanceViewMode;
  readonly label: string;
};

type ProvenanceViewModeTabsProps = {
  readonly options: readonly ProvenanceViewModeOption[];
  readonly viewMode: ProvenanceViewMode;
  readonly onViewModeChange: (mode: ProvenanceViewMode) => void;
};

function panelIdForMode(mode: ProvenanceViewMode): string {
  switch (mode) {
    case "graph":
      return "prov-graph";
    case "timeline":
      return "prov-timeline";
    case "table":
      return "prov-nodes";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function tabIdForMode(mode: ProvenanceViewMode): string {
  return `provenance-view-tab-${mode}`;
}

function panelLabelledBy(mode: ProvenanceViewMode): string {
  switch (mode) {
    case "graph":
      return "prov-graph-heading";
    case "timeline":
      return "prov-timeline-heading";
    case "table":
      return "prov-nodes-heading";
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function ProvenanceViewModeTabs(props: ProvenanceViewModeTabsProps): React.JSX.Element {
  const { options, viewMode, onViewModeChange } = props;
  const tabRefs = useRef<Partial<Record<ProvenanceViewMode, HTMLButtonElement | null>>>({});

  const focusTab = useCallback((mode: ProvenanceViewMode): void => {
    const tab = tabRefs.current[mode];

    if (tab !== null && tab !== undefined) {
      tab.focus();
    }
  }, []);

  const onTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentMode: ProvenanceViewMode): void => {
      const currentIndex = options.findIndex((option) => option.id === currentMode);

      if (currentIndex < 0) {
        return;
      }

      let nextIndex = currentIndex;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      }

      if (event.key === "Home") {
        event.preventDefault();
        nextIndex = 0;
      }

      if (event.key === "End") {
        event.preventDefault();
        nextIndex = options.length - 1;
      }

      if (nextIndex !== currentIndex) {
        const nextMode = options[nextIndex]?.id;

        if (nextMode !== undefined) {
          onViewModeChange(nextMode);
          focusTab(nextMode);
        }
      }
    },
    [focusTab, onViewModeChange, options],
  );

  return (
    <div
      className="inline-flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-700"
      role="tablist"
      aria-label="Provenance view"
    >
      {options.map((option) => {
        const selected = viewMode === option.id;

        return (
          <button
            key={option.id}
            ref={(element) => {
              tabRefs.current[option.id] = element;
            }}
            id={tabIdForMode(option.id)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelIdForMode(option.id)}
            tabIndex={selected ? 0 : -1}
            className={cn(
              "rounded px-3 py-1.5 text-sm",
              selected
                ? "bg-[var(--al-primary-action-bg)] text-[var(--al-primary-action-fg)]"
                : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
            )}
            onClick={() => onViewModeChange(option.id)}
            onKeyDown={(event) => onTabKeyDown(event, option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function provenanceViewPanelProps(mode: ProvenanceViewMode, active: boolean): {
  id: string;
  role: "tabpanel";
  "aria-labelledby": string;
  hidden?: boolean;
} {
  return {
    id: panelIdForMode(mode),
    role: "tabpanel",
    "aria-labelledby": panelLabelledBy(mode),
    hidden: active ? undefined : true,
  };
}
