"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { CitationChips } from "@/components/explanation/CitationChips";
import { DocumentLayout, type DocumentTocItem } from "@/components/DocumentLayout";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import type { ExplanationResult, RunExplanationSummary } from "@/types/explanation";
import { enterpriseStatusTagClass, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isDeterministicExplanationFallback, normalizeFiniteRatio } from "@/types/explanation";
import {
  parseRunExplanationProvenanceOpenFromSearch,
  RUN_EXPLANATION_PROVENANCE_OPEN_PARAM,
  runExplanationProvenanceDisclosureHrefFromSearch,
} from "@/lib/runs/run-explanation-provenance-disclosure-url";
import {
  presentRunExplanationHeadlineCount,
  resolveRunExplanationFindingCountForHeadline,
  RUN_EXPLANATION_COMPLIANCE_GAP_COUNT_NOT_STORED_LABEL,
  RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL,
  RUN_EXPLANATION_UNRESOLVED_COUNT_NOT_STORED_LABEL,
} from "@/lib/runs/run-explanation-headline-stats-display";

export type RunExplanationSectionProps = {
  summary: RunExplanationSummary | null;
  loading: boolean;
  error: string | null;
  runId: string;
  /** When set, overrides `summary.findingCount` in the headline stats line (spine-aligned demo counts). */
  displayFindingCount?: number | null;
  /** Buyer-facing finding titles keyed by finding id for trace rows. */
  findingTitlesById?: Readonly<Record<string, string>>;
};

/** Tailwind mapping for faithfulness support ratio (0–100). */
export function faithfulnessBadgeClass(pct: number): string {
  if (pct >= 80 - 1e-9) {
    return enterpriseStatusTagClass("ready");
  }

  if (pct >= 50 - 1e-9) {
    return enterpriseStatusTagClass("needs-attention");
  }

  return enterpriseStatusTagClass("blocked");
}

/** Tailwind styles for aggregate explanation deterministic fallback (faithfulness substitution). */
export function deterministicFallbackBadgeClass(): string {
  return enterpriseStatusTagClass("in-progress");
}

/** Tailwind mapping for risk posture label (case-insensitive). */
export function riskPostureBadgeClass(posture: string): string {
  const key = posture.trim().toLowerCase();

  if (key === "critical") {
    return enterpriseStatusTagClass("blocked");
  }

  if (key === "high") {
    return enterpriseStatusTagClass("needs-attention");
  }

  if (key === "medium") {
    return enterpriseStatusTagClass("needs-attention");
  }

  if (key.includes("not derived") || key.includes("not stored")) {
    return enterpriseStatusTagClass("neutral");
  }

  return enterpriseStatusTagClass("ready");
}

/**
 * @deprecated Use {@link riskPostureBadgeClass} for Tailwind; kept for tests that assert legacy hex palette.
 */
export function riskPostureBadgeColors(posture: string): { background: string; color: string; borderColor: string } {
  const key = posture.trim().toLowerCase();

  if (key === "critical") {
    return { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" };
  }

  if (key === "high") {
    return { background: "#ffedd5", color: "#c2410c", borderColor: "#fed7aa" };
  }

  if (key === "medium") {
    return { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" };
  }

  return { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" };
}

function confidencePercent(confidence: number | string): number | null {
  const normalized = typeof confidence === "number" ? confidence : Number(confidence);

  if (!Number.isFinite(normalized)) {
    return null;
  }

  const pct = normalized > 0 && normalized <= 1 ? Math.round(normalized * 100) : Math.round(normalized);

  if (!Number.isFinite(pct)) {
    return null;
  }

  return Math.min(100, Math.max(0, pct));
}

function presentStoredStringField(
  value: string | null | undefined,
  notStoredLabel: string,
  storedEmptyLabel: string,
): string {
  if (value === null || value === undefined) {
    return notStoredLabel;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return storedEmptyLabel;
  }

  return trimmed;
}

/** FC-69 — descriptive model confidence without percent-complete authority. */
export function modelConfidenceDescriptor(confidence: number | string | null | undefined): string | null {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const pct = confidencePercent(confidence);

  if (pct === null) {
    return null;
  }

  if (pct >= 80) {
    return "High model confidence";
  }

  if (pct >= 50) {
    return "Moderate model confidence";
  }

  return "Low model confidence";
}

export type ModelConfidencePresentation = {
  readonly headline: string;
  readonly honestyLine: string;
};

/** UU-482 / UU-493 — model self-report with finite percent when recorded. */
export function presentModelConfidence(
  confidence: number | string | null | undefined,
): ModelConfidencePresentation | null {
  if (confidence === null || confidence === undefined) {
    return null;
  }

  const descriptor = modelConfidenceDescriptor(confidence);
  const pct = confidencePercent(confidence);

  if (descriptor === null || pct === null) {
    return null;
  }

  return {
    headline: `${descriptor} (${pct}%)`,
    honestyLine:
      "Model self-report from persisted explanation JSON — not retrieval grounding and not a sponsor-ready verdict.",
  };
}

/** API payloads sometimes omit `explanation`; avoid crashing the review detail client subtree. */
function explanationBody(summary: RunExplanationSummary): ExplanationResult {
  const raw = summary.explanation;

  if (raw === null || raw === undefined) {
    return {
      rawText: "",
      structured: null,
      confidence: null,
      provenance: null,
      summary: "",
      keyDrivers: [],
      riskImplications: [],
      costImplications: [],
      complianceImplications: [],
      detailedNarrative: "",
    };
  }

  return raw;
}

/**
 * Run-level aggregate explanation: assessment, posture, confidence, themes, drivers/risks, provenance.
 */
export function RunExplanationSection({
  summary,
  loading,
  error,
  runId,
  displayFindingCount,
  findingTitlesById,
}: RunExplanationSectionProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchParamProvenanceOpen = searchParams.get(RUN_EXPLANATION_PROVENANCE_OPEN_PARAM);
  const [provenanceOpen, setProvenanceOpenState] = useState(() =>
    parseRunExplanationProvenanceOpenFromSearch(null),
  );
  const provenanceOpenRef = useRef(provenanceOpen);
  provenanceOpenRef.current = provenanceOpen;

  const syncProvenanceOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runExplanationProvenanceDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setProvenanceOpen = useCallback(
    (open: boolean) => {
      if (provenanceOpenRef.current === open) {
        return;
      }

      provenanceOpenRef.current = open;
      setProvenanceOpenState(open);
      syncProvenanceOpenToUrl(open);
    },
    [syncProvenanceOpenToUrl],
  );

  useEffect(() => {
    const syncProvenanceOpenFromUrl = (): void => {
      const next = parseRunExplanationProvenanceOpenFromSearch(
        new URLSearchParams(window.location.search).get(RUN_EXPLANATION_PROVENANCE_OPEN_PARAM),
      );

      if (provenanceOpenRef.current === next) {
        return;
      }

      provenanceOpenRef.current = next;
      setProvenanceOpenState(next);
    };

    syncProvenanceOpenFromUrl();
    window.addEventListener("popstate", syncProvenanceOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncProvenanceOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    const next = parseRunExplanationProvenanceOpenFromSearch(searchParamProvenanceOpen);

    if (provenanceOpenRef.current === next) {
      return;
    }

    provenanceOpenRef.current = next;
    setProvenanceOpenState(next);
  }, [searchParamProvenanceOpen]);

  const tocItems = useMemo((): DocumentTocItem[] => {
    if (summary === null) {
      return [];
    }

    const expl = explanationBody(summary);
    const items: DocumentTocItem[] = [{ id: "doc-explanation-assessment", label: "Assessment" }];
    const citationsMissing = summary.citations === null || summary.citations === undefined;
    const citationCount = summary.citations?.length ?? 0;

    if (citationsMissing || citationCount > 0) {
      items.push({
        id: "doc-explanation-evidence-cited",
        label: citationsMissing ? "Evidence cited was not stored." : "Evidence cited",
      });
    }

    const traces = summary.findingTraceConfidences;

    if (traces !== null && traces !== undefined && traces.length > 0) {
      items.push({
        id: "doc-explanation-traces",
        label: buyerPolishedShell ? "Trace confidence" : "Finding trace confidence",
      });
    }

    items.push({ id: "doc-explanation-confidence", label: "Model confidence" });

    items.push(
      { id: "doc-explanation-themes", label: "Themes" },
      { id: "doc-explanation-drivers", label: "Key drivers" },
      { id: "doc-explanation-risks", label: "Risk implications" },
      { id: "doc-explanation-costs", label: "Cost implications" },
    );

    items.push({
      id: "doc-explanation-provenance",
      label:
        expl.provenance !== null && expl.provenance !== undefined
          ? buyerPolishedShell
            ? "Source attribution"
            : "LLM provenance"
          : "Explanation provenance was not stored.",
    });

    return items;
  }, [summary, buyerPolishedShell]);

  if (loading) {
    return (
      <div aria-busy="true">
        <OperatorLoadingNotice>Loading explanation…</OperatorLoadingNotice>
      </div>
    );
  }

  if (error) {
    return <p role="alert" className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}>{error}</p>;
  }

  if (!summary) {
    return null;
  }

  const findingCountForStats = resolveRunExplanationFindingCountForHeadline(
    displayFindingCount,
    summary.findingCount,
  );
  const decisionCountForStats = presentRunExplanationHeadlineCount(
    summary.decisionCount,
    RUN_EXPLANATION_DECISION_COUNT_NOT_STORED_LABEL,
  );
  const unresolvedCountForStats = presentRunExplanationHeadlineCount(
    summary.unresolvedIssueCount,
    RUN_EXPLANATION_UNRESOLVED_COUNT_NOT_STORED_LABEL,
  );
  const complianceGapCountForStats = presentRunExplanationHeadlineCount(
    summary.complianceGapCount,
    RUN_EXPLANATION_COMPLIANCE_GAP_COUNT_NOT_STORED_LABEL,
  );

  const expl = explanationBody(summary);
  const themesMissing = summary.themeSummaries === null || summary.themeSummaries === undefined;
  const themeSummaries = summary.themeSummaries ?? [];
  const explanationMissing = summary.explanation === null || summary.explanation === undefined;
  const overallAssessmentRaw = summary.overallAssessment;
  const overallAssessmentTrimmed = overallAssessmentRaw?.trim() ?? "";
  const overallAssessment =
    overallAssessmentRaw === null
    || overallAssessmentRaw === undefined
    || overallAssessmentTrimmed.length === 0
      ? "Overall assessment was not stored."
      : overallAssessmentTrimmed;
  const riskPostureLabel = summary.riskPosture?.trim() || "Risk posture was not stored.";
  const postureClass = riskPostureBadgeClass(riskPostureLabel);
  const deterministicFallback = isDeterministicExplanationFallback(summary);
  const legacyDeterministicFallback = (
    summary as RunExplanationSummary & { usedDeterministicFallback?: boolean }
  ).usedDeterministicFallback;
  const deterministicFallbackFlagMissing =
    (summary.deterministicFallbackUsed === null || summary.deterministicFallbackUsed === undefined)
    && legacyDeterministicFallback === undefined;
  const conf = expl.confidence;
  const modelConfidencePresentation =
    conf !== null && conf !== undefined && (typeof conf === "number" || typeof conf === "string")
      ? presentModelConfidence(conf)
      : null;
  const prov = expl.provenance;
  const faith = normalizeFiniteRatio(summary.faithfulnessSupportRatio);
  let faithPct: number | null = null;
  let faithClass: string | null = null;

  if (faith !== null) {
    faithPct = Math.round(faith * 100);
    faithClass = faithfulnessBadgeClass(faithPct);
  }

  return (
    <DocumentLayout tocItems={tocItems}>
      <p id="doc-explanation-assessment" className={cn("m-0 leading-snug text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {overallAssessment}
      </p>

      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        <span className="sr-only">Risk posture:</span>
        <span
          role="status"
          aria-label={`Risk posture ${riskPostureLabel}`}
          data-risk-posture={riskPostureLabel.trim().toLowerCase()}
          className={postureClass}
        >
          {riskPostureLabel}
        </span>
        <span className={cn("ml-3 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {buyerPolishedShell
            ? `${decisionCountForStats} approval decisions · ${findingCountForStats} risk findings · ${unresolvedCountForStats} open items`
            : `${decisionCountForStats} decisions · ${findingCountForStats} findings · ${unresolvedCountForStats} unresolved · ${complianceGapCountForStats} compliance gaps`}
        </span>
        {deterministicFallbackFlagMissing && !deterministicFallback ? (
          <span
            role="status"
            aria-label="Deterministic fallback status"
            className={`ml-3 align-middle ${deterministicFallbackBadgeClass()}`}
          >
            Deterministic fallback was not stored.
          </span>
        ) : deterministicFallback ? (
          <span
            role="status"
            aria-label="Deterministic narrative fallback"
            className={`ml-3 align-middle ${deterministicFallbackBadgeClass()}`}
          >
            Deterministic narrative
          </span>
        ) : null}
      </p>

      {faithPct !== null && faithClass !== null ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="sr-only">Faithfulness vs findings:</span>
          <span role="status" aria-label={`Faithfulness support ratio ${faithPct} percent`} className={faithClass}>
            Faithfulness {faithPct}%
          </span>
          <span className={cn("ml-2.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            (token overlap vs finding traces — see docs)
          </span>
        </p>
      ) : (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Faithfulness support ratio was not stored.
        </p>
      )}

      {deterministicFallback && !buyerPolishedShell ? (
        <p
          role="status"
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised p-3 leading-relaxed text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          This explanation was generated from manifest structure because AI-generated text did not sufficiently match
          the underlying findings.
        </p>
      ) : null}

      {!deterministicFallback &&
      (summary.faithfulnessWarning === null || summary.faithfulnessWarning === undefined) ? (
        <p
          role="status"
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised p-3 leading-relaxed text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          Faithfulness warning was not stored.
        </p>
      ) : !deterministicFallback && summary.faithfulnessWarning ? (
        <p
          role="status"
          className={cn(
            "rounded-md border border-amber-600/40 bg-al-surface-raised p-3 leading-relaxed text-al-text-primary dark:border-amber-700/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {summary.faithfulnessWarning}
          {!buyerPolishedShell ? (
            <>
              {" "}
              <a className={cn("font-semibold", OPERATOR_LINK.nav)} href="#run-retrieval-grounding">
                View retrieval hits →
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      {summary.citations === null || summary.citations === undefined ? (
        <div id="doc-explanation-evidence-cited" className="mb-4">
          <h3 className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Evidence cited
            <span className={cn("ml-2 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              This explanation only — not the full review evidence graph.
            </span>
          </h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Evidence cited was not stored.</p>
        </div>
      ) : summary.citations.length > 0 ? (
        <div id="doc-explanation-evidence-cited">
          <h3 className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Evidence cited
            <span className={cn("ml-2 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              This explanation only — not the full review evidence graph.
            </span>
          </h3>
          <CitationChips citations={summary.citations} runId={runId} />
        </div>
      ) : (
        <div id="doc-explanation-evidence-cited">
          <h3 className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Evidence cited
            <span className={cn("ml-2 font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              This explanation only — not the full review evidence graph.
            </span>
          </h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {buyerPolishedShell
              ? "No cited evidence lines returned for this review."
              : "No explanation citations returned for this review."}
          </p>
        </div>
      )}

      {summary.findingTraceConfidences === null || summary.findingTraceConfidences === undefined ? (
        <p className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Finding traces were not stored.
        </p>
      ) : summary.findingTraceConfidences.length > 0 ? (
        <div className="mb-4">
          <h3 id="doc-explanation-traces" className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Finding trace confidence
          </h3>
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {summary.findingTraceConfidences.map((row) => {
              const findingTitle = findingTitlesById?.[row.findingId]?.trim();
              const findingLabel =
                buyerPolishedShell
                  ? findingTitle !== undefined && findingTitle.length > 0
                    ? findingTitle
                    : "Finding title was not stored."
                  : row.findingId;

              return (
              <li key={row.findingId}>
                {buyerPolishedShell ? (
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">{findingLabel}</span>
                ) : (
                  <code className={cn("rounded bg-neutral-100 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.micro)}>{row.findingId}</code>
                )}{" "}
                —{" "}
                {presentStoredStringField(
                  row.traceConfidenceLabel,
                  "Trace confidence label was not stored.",
                  "Trace confidence label was stored empty.",
                )}
                {row.ruleId && row.ruleId.trim().length > 0 ? `; rule ${row.ruleId}` : ""}
                {typeof row.evidenceRefCount === "number" && Number.isFinite(row.evidenceRefCount)
                  ? `; ${row.evidenceRefCount} evidence ref(s)`
                  : ""}
                {typeof row.evidenceRefCount === "number" && Number.isFinite(row.evidenceRefCount) ? null : (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {" "}
                    — Evidence ref count was not stored on this trace.
                  </span>
                )}
                {row.missingTraceFields === null || row.missingTraceFields === undefined ? (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {" "}
                    — Missing trace fields were not stored.
                  </span>
                ) : row.missingTraceFields.length > 0 ? (
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {" "}
                    — missing: {row.missingTraceFields.join(", ")}
                  </span>
                ) : null}
              </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div id="doc-explanation-confidence" className="mb-4">
        <p id="doc-explanation-confidence-label" className={cn("m-0 mb-1.5 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Model confidence
        </p>
        {modelConfidencePresentation !== null ? (
          <>
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
              aria-labelledby="doc-explanation-confidence-label"
            >
              {modelConfidencePresentation.headline}
            </p>
            <p className={cn("m-0 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {modelConfidencePresentation.honestyLine}
            </p>
          </>
        ) : (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Model confidence was not stored.
          </p>
        )}
      </div>

      <div className="mb-4">
        <h3 id="doc-explanation-themes" className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Themes
        </h3>
        {themesMissing ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Themes were not stored.</p>
        ) : themeSummaries.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Themes were stored empty.</p>
        ) : (
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {themeSummaries.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <h3 className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Compliance implications
        </h3>
        {explanationMissing ||
        expl.complianceImplications === null ||
        expl.complianceImplications === undefined ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Compliance implications were not stored.
          </p>
        ) : expl.complianceImplications.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Compliance implications were stored empty.
          </p>
        ) : (
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {expl.complianceImplications.map((implication) => (
              <li key={implication}>{implication}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <h3 id="doc-explanation-drivers" className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Key drivers
        </h3>
        {explanationMissing || expl.keyDrivers === null || expl.keyDrivers === undefined ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Key drivers were not stored.
          </p>
        ) : expl.keyDrivers.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Key drivers were stored empty.
          </p>
        ) : (
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {expl.keyDrivers.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <h3 id="doc-explanation-risks" className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Risk implications
        </h3>
        {explanationMissing || expl.riskImplications === null || expl.riskImplications === undefined ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Risk implications were not stored.
          </p>
        ) : expl.riskImplications.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Risk implications were stored empty.
          </p>
        ) : (
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {expl.riskImplications.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <h3 id="doc-explanation-costs" className={cn("m-0 mb-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Cost implications
        </h3>
        {explanationMissing || expl.costImplications === null || expl.costImplications === undefined ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Cost implications were not stored.
          </p>
        ) : expl.costImplications.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Cost implications were stored empty.
          </p>
        ) : (
          <ul className={cn("m-0 list-disc space-y-1 pl-5 leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
            {expl.costImplications.map((costLine) => (
              <li key={costLine}>{costLine}</li>
            ))}
          </ul>
        )}
      </div>

      {prov ? (
        <details
          id="doc-explanation-provenance"
          className={cn("text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
          open={provenanceOpen}
          onToggle={(event) => {
            event.preventDefault();
            setProvenanceOpen(!provenanceOpenRef.current);
          }}
        >
          <summary className={cn("cursor-pointer font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {buyerPolishedShell ? "How this narrative was produced" : "Provenance metadata"}
          </summary>
          <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt>Agent type</dt>
            <dd className="m-0">{buyerLabelForAgentType(prov.agentType)}</dd>
            <dt>Model ID</dt>
            <dd className="m-0">
              {presentStoredStringField(
                prov.modelId,
                "Model id was not stored.",
                "Model id was stored empty.",
              )}
            </dd>
            <dt>Prompt template</dt>
            <dd className="m-0">
              {presentStoredStringField(
                prov.promptTemplateId,
                "Prompt template was not stored.",
                "Prompt template was stored empty.",
              )}
            </dd>
            <dt>Prompt version</dt>
            <dd className="m-0">
              {presentStoredStringField(
                prov.promptTemplateVersion,
                "Prompt version was not stored.",
                "Prompt version was stored empty.",
              )}
            </dd>
            <dt>Content hash</dt>
            <dd className="m-0">
              {presentStoredStringField(
                prov.promptContentHash,
                "Content hash was not stored.",
                "Content hash was stored empty.",
              )}
            </dd>
          </dl>
        </details>
      ) : (
        <p
          id="doc-explanation-provenance"
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        >
          Explanation provenance was not stored.
        </p>
      )}
    </DocumentLayout>
  );
}
