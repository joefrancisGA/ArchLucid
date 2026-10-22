"use client";

import { useCallback } from "react";
import type { ReactElement } from "react";

import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";

export type ProvenanceViewMode = "graph" | "timeline" | "table";

export type ProvenanceViewModeOption = {
  readonly id: ProvenanceViewMode;
  readonly label: string;
};

type ProvenanceViewModeSwitcherProps = {
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

export function provenanceViewModeTestId(mode: ProvenanceViewMode): string {
  return `provenance-view-mode-${mode}`;
}

/**
 * Same-page view switcher for the provenance workspace.
 *
 * Uses the documented segmented `aria-pressed` pattern rather than tab roles: the
 * three view panels are separate page regions rather than a single swapped panel,
 * so a tablist/tabpanel pairing would misdescribe the page to assistive tech.
 * See `docs/library/UI_DESIGN_SYSTEM.md` § *Operator line tabs — visual contract*.
 */
export function ProvenanceViewModeSwitcher(props: ProvenanceViewModeSwitcherProps): ReactElement {
  const { options, viewMode, onViewModeChange } = props;

  // The shared toolbar is mode-agnostic (string ids), so resolve back to the typed
  // mode instead of casting the id it hands back.
  const onTabChange = useCallback(
    (tabId: string): void => {
      const selected = options.find((option) => option.id === tabId);

      if (selected !== undefined) {
        onViewModeChange(selected.id);
      }
    },
    [onViewModeChange, options],
  );

  return (
    <OperatorSegmentedModeToolbar
      tabs={options.map((option) => ({
        id: option.id,
        label: option.label,
        testId: provenanceViewModeTestId(option.id),
      }))}
      activeTabId={viewMode}
      onTabChange={onTabChange}
      ariaLabel="Provenance view"
      className="mb-0"
    />
  );
}

export function provenanceViewPanelProps(mode: ProvenanceViewMode, active: boolean): {
  id: string;
  role: "region";
  "aria-labelledby": string;
  hidden?: boolean;
} {
  return {
    id: panelIdForMode(mode),
    role: "region",
    "aria-labelledby": panelLabelledBy(mode),
    hidden: active ? undefined : true,
  };
}
