"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { SeverityTag } from "@/components/ui/severity-tag";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_FINDINGS_DUAL_PANE_EMPTY_FINDINGS,
  ARCHITECTURE_FINDINGS_DUAL_PANE_INTRO,
  ARCHITECTURE_FINDINGS_DUAL_PANE_LINKED_VIEW_TITLE,
  ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID,
  buildArchitectureFindingsDualPaneFindingsHref,
  formatLinkedComponentStatus,
  resolveFindingDiagramSelectionSync,
  type ArchitectureFindingsDualPaneDiagramNode,
  type ArchitectureFindingsDualPaneFindingRef,
} from "@/lib/architecture-findings-dual-pane";
import {
  severityBadgeLabel,
  severityKindFromNumericValue,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureFindingsDualPaneProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  /** Existing diagram island (ArchitectureDiagramPanel) rendered on the left. */
  readonly diagram: ReactNode;
  readonly diagramNodes?: readonly ArchitectureFindingsDualPaneDiagramNode[];
  readonly onHighlightedNodeIdChange?: (nodeId: string | null) => void;
  readonly className?: string;
};

function toFindingRef(finding: QuickDecisionFinding): ArchitectureFindingsDualPaneFindingRef {
  return {
    findingId: finding.findingId,
    title: finding.title,
    wireJson: finding.aiReasoning?.wireJson ?? null,
  };
}

/**
 * TB-2201 — side-by-side architecture diagram and findings with selection sync.
 * Provenance ("why is this here?") remains TB-2180 on the diagram panel.
 */
export function ArchitectureFindingsDualPane(props: ArchitectureFindingsDualPaneProps): React.JSX.Element {
  const diagramNodes = props.diagramNodes ?? [];
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const findingItemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const visibleFindings = useMemo(
    () => props.findings.filter((finding) => !finding.isMuted),
    [props.findings],
  );

  const selectedFinding =
    selectedFindingId === null
      ? null
      : (visibleFindings.find((finding) => finding.findingId === selectedFindingId) ?? null);

  const selectionSync = useMemo(() => {
    if (selectedFinding === null) {
      return null;
    }

    return resolveFindingDiagramSelectionSync(toFindingRef(selectedFinding), diagramNodes);
  }, [diagramNodes, selectedFinding]);

  const onHighlightedNodeIdChange = props.onHighlightedNodeIdChange;

  useEffect(() => {
    const nodeId = selectionSync?.matchedNodeId ?? null;
    onHighlightedNodeIdChange?.(nodeId);
  }, [onHighlightedNodeIdChange, selectionSync?.matchedNodeId]);

  useEffect(() => {
    if (selectedFindingId === null) {
      return;
    }

    const el = findingItemRefs.current.get(selectedFindingId);

    if (el !== undefined) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedFindingId]);

  const findingsHref = buildArchitectureFindingsDualPaneFindingsHref(props.runId);

  return (
    <section
      className={cn("space-y-3", props.className)}
      data-testid="architecture-findings-dual-pane"
      data-layout-mode={ARCHITECTURE_FINDINGS_DUAL_PANE_LAYOUT_MODE_ID}
      aria-labelledby="architecture-findings-dual-pane-heading"
    >
      <div className="space-y-1">
        <h3
          id="architecture-findings-dual-pane-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {ARCHITECTURE_FINDINGS_DUAL_PANE_LINKED_VIEW_TITLE}
        </h3>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_FINDINGS_DUAL_PANE_INTRO}
        </p>
      </div>

      {selectionSync !== null ? (
        <p
          className={cn(
            "m-0 rounded-md border border-teal-200 bg-teal-50/80 px-3 py-2 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          role="status"
          data-testid="architecture-findings-dual-pane-link-status"
        >
          {formatLinkedComponentStatus(selectionSync)}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="min-w-0" data-testid="architecture-findings-dual-pane-diagram">
          {props.diagram}
        </div>

        <aside
          className="min-w-0 space-y-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          data-testid="architecture-findings-dual-pane-findings"
          aria-label="Findings linked to architecture diagram"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Findings</p>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={findingsHref} className={OPERATOR_LINK.nav}>
                Open findings tab
              </Link>
            </Button>
          </div>

          {visibleFindings.length === 0 ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="architecture-findings-dual-pane-empty"
            >
              {ARCHITECTURE_FINDINGS_DUAL_PANE_EMPTY_FINDINGS}
            </p>
          ) : (
            <ul className="m-0 max-h-[32rem] list-none space-y-2 overflow-y-auto p-0">
              {visibleFindings.map((finding) => {
                const active = finding.findingId === selectedFindingId;
                const sync = resolveFindingDiagramSelectionSync(toFindingRef(finding), diagramNodes);

                return (
                  <li
                    key={finding.findingId}
                    ref={(el) => {
                      if (el === null) {
                        findingItemRefs.current.delete(finding.findingId);
                      } else {
                        findingItemRefs.current.set(finding.findingId, el);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-md border px-3 py-2 text-left transition-colors",
                        active
                          ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600/30 dark:border-teal-400 dark:bg-teal-950/50"
                          : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
                      )}
                      aria-pressed={active}
                      data-testid={`architecture-findings-dual-pane-finding-${finding.findingId}`}
                      onClick={() => {
                        setSelectedFindingId(finding.findingId);
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityTag
                          severity={severityKindFromNumericValue(finding.severityValue)}
                          label={severityBadgeLabel(finding.severityValue)}
                        />
                        {sync.matchedNodeLabel !== null ? (
                          <span
                            className={cn("text-teal-800 dark:text-teal-200", OPERATOR_TYPOGRAPHY.helper)}
                            data-testid={`architecture-findings-dual-pane-finding-node-${finding.findingId}`}
                          >
                            {sync.matchedNodeLabel}
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("m-0 mt-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {finding.title}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}