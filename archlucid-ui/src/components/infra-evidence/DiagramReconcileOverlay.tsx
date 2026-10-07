"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { renderMermaidSvgMarkup } from "@/lib/mermaid/mermaid-safe-render";
import {
  resolveDiagramReconcileOverlayStyle,
  type DiagramReconcileOverlayMatch,
} from "@/lib/infra-evidence/diagram-reconcile-overlay";
import type { DiagramInfrastructureCorrespondenceRow } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";
import { formatDiagramReconcileMatchKindLabel } from "@/lib/infra-evidence/diagram-reconcile-match-kind-display";
import { prepareMermaidSvgForResponsiveLayout } from "@/lib/help/help-mermaid";

type DiagramReconcileOverlayProps = {
  readonly source: string;
  readonly rows: readonly DiagramInfrastructureCorrespondenceRow[];
  readonly enabled: boolean;
};

function paintMatches(
  svgMarkup: string,
  matches: readonly DiagramReconcileOverlayMatch[],
  enabled: boolean,
): string {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgMarkup, "image/svg+xml");

  document.querySelectorAll("g.node").forEach((node) => {
    const nodeId = node.querySelector("title")?.textContent?.trim() ?? "";
    const match = matches.find((candidate) => candidate.nodeId === nodeId);

    if (!enabled || match == null) {
      return;
    }

    const style = resolveDiagramReconcileOverlayStyle(match.matchKind);
    node.querySelectorAll("rect, polygon").forEach((shape) => {
      shape.setAttribute("stroke", style.stroke);
      shape.setAttribute("stroke-width", style.strokeWidth);
    });
  });

  return new XMLSerializer().serializeToString(document.documentElement);
}

export function DiagramReconcileOverlay(props: DiagramReconcileOverlayProps): React.JSX.Element {
  const renderId = useId().replaceAll(":", "");
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const matches = useMemo(
    () => props.rows
      .filter((row) => row.diagramNodeId != null && row.diagramNodeId.trim().length > 0)
      .map((row) => ({ nodeId: row.diagramNodeId!, matchKind: row.matchKind })),
    [props.rows],
  );

  useEffect(() => {
    let cancelled = false;

    async function render(): Promise<void> {
      const svg = await renderMermaidSvgMarkup(props.source, {
        renderIdBase: `diagram-reconcile-${renderId}`,
        initialize: (mermaid) => {
          mermaid.initialize({
            startOnLoad: false,
            theme: "neutral",
            securityLevel: "strict",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          });
        },
      });

      if (!cancelled) {
        setSvgMarkup(paintMatches(prepareMermaidSvgForResponsiveLayout(svg), matches, props.enabled));
      }
    }

    setSvgMarkup(null);
    void render();

    return (): void => {
      cancelled = true;
    };
  }, [matches, props.enabled, props.source, renderId]);

  return (
    <section className="grid gap-2" aria-label="Imported diagram match overlay">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Imported diagram</h3>
        <StatusTag kind={props.enabled ? "ready" : "neutral"} label={props.enabled ? "Match shown" : "Ordinary outlines"} />
      </div>
      <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950/80">
        {svgMarkup == null ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} aria-live="polite">Rendering imported diagram…</p>
        ) : (
          <div
            className="w-full min-w-0 [&_svg]:block"
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
            data-testid="infra-diagram-reconcile-overlay-svg"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Imported diagram match legend">
        {matches
          .map((match) => match.matchKind)
          .filter((value, index, values) => values.indexOf(value) === index)
          .map((matchKind) => {
            const style = resolveDiagramReconcileOverlayStyle(matchKind);
            return (
              <StatusTag
                key={matchKind}
                kind={style.statusKind}
                label={formatDiagramReconcileMatchKindLabel(matchKind)}
              />
            );
          })}
      </div>
    </section>
  );
}
