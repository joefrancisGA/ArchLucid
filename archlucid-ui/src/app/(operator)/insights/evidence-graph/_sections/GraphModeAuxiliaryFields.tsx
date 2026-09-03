"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { graphNeighborhoodDepthHrefFromSearch } from "@/lib/insights/graph-neighborhood-depth-url";
import {
  graphDecisionIdHrefFromSearch,
  graphNodeIdHrefFromSearch,
} from "@/lib/insights/graph-node-decision-id-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { GraphMode } from "@/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers";

const GRAPH_DEPTH_CHIP_OPTIONS = [1, 2, 3] as const;

export type GraphModeAuxiliaryFieldsProps = {
  mode: GraphMode;
  graphMainColumnMaxClass: string;
  decisionId: string;
  onDecisionIdChange: (value: string) => void;
  nodeId: string;
  onNodeIdChange: (value: string) => void;
  depth: number;
  onDepthChange: (value: number) => void;
};

export function GraphModeAuxiliaryFields(props: GraphModeAuxiliaryFieldsProps) {
  const {
    mode,
    graphMainColumnMaxClass,
    decisionId,
    onDecisionIdChange,
    nodeId,
    onNodeIdChange,
    depth,
    onDepthChange,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? EVIDENCE_GRAPH_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref =
        mode === "decision-subgraph"
          ? graphDecisionIdHrefFromSearch(currentSearch, decisionId, pathname)
          : graphNodeIdHrefFromSearch(currentSearch, nodeId, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [currentSearch, decisionId, mode, nodeId, pathname, router]);

  const onDepthChipSelect = (nextDepth: number): void => {
    onDepthChange(nextDepth);
    router.replace(graphNeighborhoodDepthHrefFromSearch(currentSearch, nextDepth, pathname), { scroll: false });
  };

  if (mode === "decision-subgraph") {
    return (
      <div className={cn("mb-3", graphMainColumnMaxClass)}>
        <Label htmlFor="graph-decision-id">Decision ID</Label>
        <Input
          id="graph-decision-id"
          value={decisionId}
          onChange={(e) => onDecisionIdChange(e.target.value)}
          placeholder="e.g. claims.intake.boundary"
          className={cn("mt-1.5 max-w-xl font-mono", OPERATOR_TYPOGRAPHY.body)}
        />
      </div>
    );
  }

  if (mode === "node-neighborhood") {
    return (
      <div className={cn("mb-3 space-y-3", graphMainColumnMaxClass)}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 sm:max-w-md">
            <Label htmlFor="graph-node-id">Node ID</Label>
            <Input
              id="graph-node-id"
              value={nodeId}
              onChange={(e) => onNodeIdChange(e.target.value)}
              placeholder="Graph node identifier"
              className={cn("mt-1.5 font-mono", OPERATOR_TYPOGRAPHY.body)}
            />
          </div>
          <div>
            <Label htmlFor="graph-depth">Depth</Label>
            <Input
              id="graph-depth"
              type="number"
              min={0}
              max={10}
              value={depth}
              onChange={(e) => onDepthChipSelect(Number(e.target.value))}
              className="mt-1.5 w-20"
            />
          </div>
        </div>
        <FilterChipGroup aria-label="Graph neighborhood depth" className="flex flex-wrap gap-2">
          {GRAPH_DEPTH_CHIP_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              href={graphNeighborhoodDepthHrefFromSearch(currentSearch, option, pathname)}
              scroll={false}
              className={buyerFilterChipClass(depth === option, false)}
              aria-current={depth === option ? "page" : undefined}
              data-testid={`graph-depth-${option}`}
              onClick={() => {
                onDepthChipSelect(option);
              }}
            >
              Depth {option}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
    );
  }

  return null;
}
