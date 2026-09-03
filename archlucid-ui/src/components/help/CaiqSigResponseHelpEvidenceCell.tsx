import type { ReactNode } from "react";

import {
  CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT,
  countWordsInCaiqSigEvidenceText,
  parseCaiqSigEvidenceSegments,
  resolveCaiqSigEvidenceAffordance,
  type CaiqSigEvidenceAffordanceKind,
  type CaiqSigEvidenceSegment,
} from "@/lib/caiq-sig-response-help-presentation";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CaiqSigResponseHelpEvidenceCellProps = {
  readonly evidenceMarkdown: string;
  readonly statusLabel?: string;
  readonly renderInline: (text: string, keyPrefix: string) => ReactNode[];
};

function evidenceKindClass(kind: CaiqSigEvidenceAffordanceKind): string {
  switch (kind) {
    case "linked-artifact":
      return "text-al-text-secondary";
    case "inherited-provider":
      return "text-al-text-secondary";
    case "nda-on-request":
      return "text-al-text-secondary";
    case "prose-only":
      return "text-al-text-secondary";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function renderEvidenceSegmentBody(
  segment: CaiqSigEvidenceSegment,
  renderInline: (text: string, keyPrefix: string) => ReactNode[],
  keyPrefix: string,
): React.JSX.Element {
  const wordCount = countWordsInCaiqSigEvidenceText(segment.text);
  const needsDisclosure = wordCount > CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT;

  if (!needsDisclosure) {
    return <div>{renderInline(segment.text, keyPrefix)}</div>;
  }

  const previewWords = segment.text.trim().split(/\s+/).slice(0, CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT);
  const preview = `${previewWords.join(" ")}…`;

  return (
    <details className="group">
      <summary className={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {preview}
      </summary>
      <div className="mt-1">{renderInline(segment.text, `${keyPrefix}-full`)}</div>
    </details>
  );
}

export function CaiqSigResponseHelpEvidenceCell(props: CaiqSigResponseHelpEvidenceCellProps): React.JSX.Element {
  const affordance = resolveCaiqSigEvidenceAffordance(props.evidenceMarkdown, props.statusLabel);
  const segments = parseCaiqSigEvidenceSegments(props.evidenceMarkdown);

  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        const keyPrefix = `caiq-sig-evidence-${segment.kind}-${index}`;

        if (segment.kind === "gap") {
          return (
            <div key={keyPrefix} className="rounded-sm border border-neutral-200 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/40">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                Gap / next step
              </p>
              <div className="mt-1">{props.renderInline(segment.text, keyPrefix)}</div>
            </div>
          );
        }

        if (segment.kind === "evidence") {
          return (
            <div key={keyPrefix}>
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Evidence</p>
              <div className="mt-1">
                {renderEvidenceSegmentBody(segment, props.renderInline, keyPrefix)}
              </div>
            </div>
          );
        }

        return (
          <div key={keyPrefix}>{renderEvidenceSegmentBody(segment, props.renderInline, keyPrefix)}</div>
        );
      })}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, evidenceKindClass(affordance.kind))}>
        {affordance.qualifier}
      </p>
    </div>
  );
}
