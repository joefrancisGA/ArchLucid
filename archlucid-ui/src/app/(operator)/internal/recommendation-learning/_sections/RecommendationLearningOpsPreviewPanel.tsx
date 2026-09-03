"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { RecommendationLearningPreview } from "@/types/recommendation-learning-operational";

import { validationCheckStatusTagKind } from "./recommendation-learning-ops-display";

type Props = {
  readonly preview: RecommendationLearningPreview;
};

export function RecommendationLearningOpsPreviewPanel(props: Props) {
  const { preview } = props;
  const validationChecks = preview.validationChecks;

  return (
    <article className="rounded-lg border border-al-border/70 p-4">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Preview validation</h2>
        <ul className="m-0 space-y-2 p-0">
          {validationChecks.map((check) => (
            <li key={check.name} className="list-none rounded border border-al-border/50 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{check.name}</span>
                <StatusTag kind={validationCheckStatusTagKind(check.result)} label={check.result} />
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{check.detail}</p>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-3 font-mono text-sm">Correlation ID: {preview.correlationId}</p>
        <p className="m-0 font-mono text-sm">Build duration: {preview.buildDurationMs} ms</p>
    </article>
  );
}
