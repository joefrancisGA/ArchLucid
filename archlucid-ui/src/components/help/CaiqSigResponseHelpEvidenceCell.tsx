"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  CAIQ_SIG_EVIDENCE_SEGMENT_KEY_PARAM,
  caiqSigEvidenceSegmentDisclosureHrefFromSearch,
  parseCaiqSigEvidenceSegmentKeyFromSearch,
} from "@/lib/help/caiq-sig-evidence-segment-disclosure-url";
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

function CaiqSigEvidenceSegmentBody(props: {
  readonly segment: CaiqSigEvidenceSegment;
  readonly segmentKey: string;
  readonly renderInline: (text: string, keyPrefix: string) => ReactNode[];
  readonly openSegmentKey: string;
  readonly onSegmentKeyOpenChange: (segmentKey: string | null) => void;
}): React.JSX.Element {
  const wordCount = countWordsInCaiqSigEvidenceText(props.segment.text);
  const needsDisclosure = wordCount > CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT;

  if (!needsDisclosure) {
    return <div>{props.renderInline(props.segment.text, props.segmentKey)}</div>;
  }

  const previewWords = props.segment.text.trim().split(/\s+/).slice(0, CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT);
  const preview = `${previewWords.join(" ")}…`;

  return (
    <details
      className="group"
      open={props.openSegmentKey === props.segmentKey}
      onToggle={(event) =>
        props.onSegmentKeyOpenChange(event.currentTarget.open ? props.segmentKey : null)
      }
    >
      <summary className={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {preview}
      </summary>
      <div className="mt-1">{props.renderInline(props.segment.text, `${props.segmentKey}-full`)}</div>
    </details>
  );
}

export function CaiqSigResponseHelpEvidenceCell(props: CaiqSigResponseHelpEvidenceCellProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const caiqSigEvidenceSegmentKeyParam = searchParams.get(CAIQ_SIG_EVIDENCE_SEGMENT_KEY_PARAM);
  const [openSegmentKey, setOpenSegmentKeyState] = useState(() =>
    parseCaiqSigEvidenceSegmentKeyFromSearch(caiqSigEvidenceSegmentKeyParam),
  );
  const syncOpenSegmentKeyToUrl = useCallback(
    (segmentKey: string | null) => {
      router.replace(
        caiqSigEvidenceSegmentDisclosureHrefFromSearch(searchParams.toString(), segmentKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenSegmentKey = useCallback(
    (segmentKey: string | null) => {
      setOpenSegmentKeyState(segmentKey ?? "");
      syncOpenSegmentKeyToUrl(segmentKey);
    },
    [syncOpenSegmentKeyToUrl],
  );
  const affordance = resolveCaiqSigEvidenceAffordance(props.evidenceMarkdown, props.statusLabel);
  const segments = parseCaiqSigEvidenceSegments(props.evidenceMarkdown);

  useEffect(() => {
    setOpenSegmentKeyState(parseCaiqSigEvidenceSegmentKeyFromSearch(caiqSigEvidenceSegmentKeyParam));
  }, [caiqSigEvidenceSegmentKeyParam]);

  return (
    <div className="space-y-2">
      {segments.map((segment, index) => {
        const segmentKey = `caiq-sig-evidence-${segment.kind}-${index}`;

        if (segment.kind === "gap") {
          return (
            <div key={segmentKey} className="rounded-sm border border-neutral-200 bg-neutral-50/80 p-2 dark:border-neutral-700 dark:bg-neutral-900/40">
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>
                Gap / next step
              </p>
              <div className="mt-1">{props.renderInline(segment.text, segmentKey)}</div>
            </div>
          );
        }

        if (segment.kind === "evidence") {
          return (
            <div key={segmentKey}>
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Evidence</p>
              <div className="mt-1">
                <CaiqSigEvidenceSegmentBody
                  segment={segment}
                  segmentKey={segmentKey}
                  renderInline={props.renderInline}
                  openSegmentKey={openSegmentKey}
                  onSegmentKeyOpenChange={setOpenSegmentKey}
                />
              </div>
            </div>
          );
        }

        return (
          <div key={segmentKey}>
            <CaiqSigEvidenceSegmentBody
              segment={segment}
              segmentKey={segmentKey}
              renderInline={props.renderInline}
              openSegmentKey={openSegmentKey}
              onSegmentKeyOpenChange={setOpenSegmentKey}
            />
          </div>
        );
      })}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, evidenceKindClass(affordance.kind))}>
        {affordance.qualifier}
      </p>
    </div>
  );
}
