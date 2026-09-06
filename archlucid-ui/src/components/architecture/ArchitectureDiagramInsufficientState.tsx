"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION,
  ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING,
  ARCHITECTURE_DIAGRAM_INSUFFICIENT_ORIENTATION,
  ARCHITECTURE_DIAGRAM_REGENERATE_ACTION,
} from "@/lib/architecture/architecture-diagram-copy";
import { ARCHITECTURE_CREATED_DIAGRAM_BUYER_INSUFFICIENT_BODY } from "@/lib/architecture/architecture-created-diagram-sources";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { ArchitectureDiagramPanelState } from "./use-architecture-diagram-panel";

type ArchitectureDiagramInsufficientStateProps = {
  readonly panel: ArchitectureDiagramPanelState;
  readonly buyerPolishedShell?: boolean;
};

export function ArchitectureDiagramInsufficientState(
  props: ArchitectureDiagramInsufficientStateProps,
): React.JSX.Element {
  const { panel, buyerPolishedShell = false } = props;

  const clarifyArchitectureVariant = panel.clarifyArchitectureVariant;

  const diagramClarifyAction =
    panel.onClarificationsNavigate !== undefined ? (
      <Button
        type="button"
        variant={clarifyArchitectureVariant}
        data-testid="architecture-diagram-clarify-architecture"
        onClick={panel.onClarificationsNavigate}
      >
        {ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION}
      </Button>
    ) : panel.clarifyHref !== undefined ? (
      <Button type="button" variant={clarifyArchitectureVariant} asChild data-testid="architecture-diagram-clarify-architecture">
        <Link href={panel.clarifyHref}>{ARCHITECTURE_DIAGRAM_CLARIFY_ARCHITECTURE_ACTION}</Link>
      </Button>
    ) : null;

  const insufficientRegenerateApplicable = panel.versionsCount > 0 && panel.canEdit;

  return (
    <div className="space-y-3 rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700" data-testid="architecture-diagram-insufficient" role="status">
      <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
        {ARCHITECTURE_DIAGRAM_INSUFFICIENT_HEADING}
      </p>
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {buyerPolishedShell
          ? ARCHITECTURE_CREATED_DIAGRAM_BUYER_INSUFFICIENT_BODY
          : ARCHITECTURE_DIAGRAM_INSUFFICIENT_ORIENTATION}
      </p>
      {panel.missingExplanation.length > 0 ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{panel.missingExplanation}</p>
      ) : null}
      {!buyerPolishedShell && (diagramClarifyAction !== null || insufficientRegenerateApplicable) ? (
        <div className="flex flex-wrap gap-2">
          {diagramClarifyAction}
          {insufficientRegenerateApplicable ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="architecture-diagram-insufficient-regenerate"
              onClick={() => void panel.runGeneration(true)}
            >
              {ARCHITECTURE_DIAGRAM_REGENERATE_ACTION}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
