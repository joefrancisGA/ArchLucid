"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { FindingInspectDiagramCitationPreviewDialog } from "@/components/findings/FindingInspectDiagramCitationPreviewDialog";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DiagramEvidenceCitation } from "@/lib/findings/diagram-evidence-citation";
import {
  FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM,
  findingInspectEvidenceCitationDisclosureHrefFromSearch,
  parseFindingInspectEvidenceCitationArtifactIdFromSearch,
} from "@/lib/findings/finding-inspect-evidence-citation-disclosure-url";
import {
  FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM,
  findingInspectDiagramCitationPreviewHrefFromSearch,
  parseDiagramCitationPreviewParam,
} from "@/lib/findings/finding-inspect-diagram-citation-preview-url";
import {
  findingInspectEvidenceExcerptTitle,
  type FindingPolicyEvidenceCitationModel,
} from "@/lib/findings/finding-policy-evidence-citations";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import type { FindingInspectEvidence } from "@/types/finding-inspect";

import { FindingInspectPolicyRuleCallout } from "./FindingInspectPolicyRuleCallout";

export type FindingInspectEvidenceSectionProps = {
  readonly runId: string;
  readonly demoFillGaps: boolean;
  readonly reviewContextHref: string;
  readonly reviewContextLabel: string;
  readonly evidence: FindingInspectEvidence[];
  readonly evidenceListReturned?: boolean;
  readonly citationModel?: FindingPolicyEvidenceCitationModel | null;
};

const FINDING_INSPECT_EVIDENCE_EXCERPT_NOT_STORED = "Evidence excerpt was not stored." as const;
const FINDING_INSPECT_EVIDENCE_EXCERPT_STORED_EMPTY = "Evidence excerpt was stored empty." as const;

function evidenceCitationTitle(row: FindingInspectEvidence): string {
  if (row.excerpt === null || row.excerpt === undefined) {
    return FINDING_INSPECT_EVIDENCE_EXCERPT_NOT_STORED;
  }

  if (row.excerpt.length === 0) {
    return FINDING_INSPECT_EVIDENCE_EXCERPT_STORED_EMPTY;
  }

  const excerpt = row.excerpt.trim();

  if (excerpt.length === 0) {
    return FINDING_INSPECT_EVIDENCE_EXCERPT_STORED_EMPTY;
  }

  if (excerpt.length > 0) {
    return findingInspectEvidenceExcerptTitle(excerpt);
  }

  return FINDING_INSPECT_EVIDENCE_EXCERPT_NOT_STORED;
}

const FINDING_INSPECT_EVIDENCE_LINK_NOT_STORED = "Evidence link was not stored." as const;

function evidenceLinkLabel(
  row: FindingInspectEvidence,
  fallbackLabel: string,
  hasDiagramCitation: boolean,
  hasHref: boolean,
): string {
  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0 && !hasHref) {
    return FINDING_INSPECT_EVIDENCE_LINK_NOT_STORED;
  }

  if (artifact.length > 0 && hasHref) {
    return `Open evidence artifact ${artifact}`;
  }

  if (artifact.length > 0) {
    return `Open ${artifact}`;
  }

  return fallbackLabel;
}

function evidenceCitationSlug(row: FindingInspectEvidence, idx: number): string {
  const artifact = row.artifactId?.trim() ?? "";

  if (artifact.length > 0) {
    return artifact;
  }

  return `row-${idx}`;
}

function EvidenceExcerptBody({ text }: { readonly text: string }): ReactElement {
  const proseLike = text.includes(" ") && text.length > 24;

  if (proseLike) {
    return <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{text}</p>;
  }

  return <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{text}</span>;
}

function EvidenceCitationList(props: {
  readonly evidence: FindingInspectEvidence[];
  readonly reviewContextHref: string;
  readonly reviewContextLabel: string;
  readonly buyerPolishedShell: boolean;
  readonly citationEvidence?: readonly {
    readonly label: string;
    readonly href: string;
    readonly diagramCitation?: DiagramEvidenceCitation | null;
  }[];
  readonly openCitationArtifactId: string;
  readonly onCitationOpenChange: (artifactId: string | null) => void;
  readonly pathname: string;
  readonly searchParamsString: string;
}): ReactElement {
  const { evidence, reviewContextHref, reviewContextLabel, buyerPolishedShell } = props;

  if (evidence.length === 0) {
    return (
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No evidence citations were stored.</p>
    );
  }

  return (
    <ul className={cn("mt-2 list-none space-y-3 p-0", OPERATOR_TYPOGRAPHY.body)}>
      {evidence.map((row, idx) => {
        const excerpt = row.excerpt?.trim() ?? "";
        const title = evidenceCitationTitle(row);
        const citationRow = props.citationEvidence?.[idx];
        const diagramCitation = citationRow?.diagramCitation ?? null;
        const href =
          diagramCitation !== null
            ? findingInspectDiagramCitationPreviewHrefFromSearch(
                props.searchParamsString,
                diagramCitation,
                props.pathname,
              )
            : citationRow?.href ?? null;
        const hasHref = href !== null;
        const citationLabel = citationRow?.label?.trim() ?? "";
        const linkLabel =
          citationLabel.length > 0
            ? citationLabel
            : evidenceLinkLabel(row, reviewContextLabel, diagramCitation !== null, hasHref);
        const citationSlug = evidenceCitationSlug(row, idx);
        const citationOpen = props.openCitationArtifactId === citationSlug;

        return (
          <li
            key={`${row.excerpt ?? "ev"}-${row.artifactId ?? ""}-${idx}`}
            className="rounded-md border border-neutral-200 bg-white/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/60"
          >
            <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
            {excerpt.length > 0 && excerpt !== title ? <EvidenceExcerptBody text={excerpt} /> : null}
            {buyerPolishedShell && (row.lineRange !== "" || row.artifactId !== "") ? (
              <details
                className="mt-2"
                open={citationOpen}
                onToggle={(event) => {
                  event.preventDefault();
                  props.onCitationOpenChange(citationOpen ? null : citationSlug);
                }}
              >
                <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                  View technical citation
                </summary>
                <div className={cn("mt-1 space-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {row.lineRange === null || row.lineRange === undefined ? (
                    <p className="m-0">Line range was not stored.</p>
                  ) : row.lineRange.length === 0 ? (
                    <p className="m-0">Line range was stored empty.</p>
                  ) : (
                    <p className="m-0">Lines: {row.lineRange}</p>
                  )}
                  {row.artifactId === null || row.artifactId === undefined ? (
                    <p className="m-0 font-mono">Evidence artifact id was not stored.</p>
                  ) : row.artifactId.length === 0 ? (
                    <p className="m-0 font-mono">Evidence artifact id was stored empty.</p>
                  ) : (
                    <p className="m-0 font-mono">Artifact id: {row.artifactId}</p>
                  )}
                </div>
              </details>
            ) : (
              <>
                {row.lineRange === null || row.lineRange === undefined ? (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Line range was not stored.
                  </p>
                ) : row.lineRange.length === 0 ? (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Line range was stored empty.
                  </p>
                ) : (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Lines: {row.lineRange}
                  </p>
                )}
                {row.artifactId === null || row.artifactId === undefined ? (
                  <p className={cn("m-0 mt-1 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Evidence artifact id was not stored.
                  </p>
                ) : row.artifactId.length === 0 ? (
                  <p className={cn("m-0 mt-1 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Evidence artifact id was stored empty.
                  </p>
                ) : (
                  <p className={cn("m-0 mt-1 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    Artifact id: {row.artifactId}
                  </p>
                )}
              </>
            )}
            <div className="mt-2">
              {href !== null ? (
                <Link
                  href={href}
                  className={OPERATOR_LINK.optional}
                  data-testid={
                    diagramCitation !== null ? "finding-diagram-citation-link" : "finding-source-evidence-link"
                  }
                >
                  {linkLabel}
                </Link>
              ) : (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="finding-source-evidence-link-missing"
                >
                  {linkLabel}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Customer policy rule plus architecture evidence citations for finding inspect surfaces. */
export function FindingInspectEvidenceSection({
  runId,
  demoFillGaps,
  reviewContextHref,
  reviewContextLabel,
  evidence,
  evidenceListReturned,
  citationModel = null,
}: FindingInspectEvidenceSectionProps): ReactElement {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchParamsString = readWindowLocationSearch();
  const urlOpenCitationArtifactId = parseFindingInspectEvidenceCitationArtifactIdFromSearch(
    searchParams.get(FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM),
  );
  const urlDiagramPreviewCitation = parseDiagramCitationPreviewParam(
    searchParams.get(FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM),
  );
  const readOpenCitationArtifactIdFromUrl = (): string =>
    parseFindingInspectEvidenceCitationArtifactIdFromSearch(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
        FINDING_INSPECT_EVIDENCE_CITATION_ARTIFACT_ID_PARAM,
      ),
    );
  const readDiagramPreviewCitationFromUrl = (): DiagramEvidenceCitation | null =>
    parseDiagramCitationPreviewParam(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
        FINDING_INSPECT_DIAGRAM_CITATION_PREVIEW_PARAM,
      ),
    );
  const [openCitationArtifactId, setOpenCitationArtifactIdState] = useState(() => readOpenCitationArtifactIdFromUrl());
  const openCitationArtifactIdRef = useRef(openCitationArtifactId);
  openCitationArtifactIdRef.current = openCitationArtifactId;
  const [diagramPreviewCitation, setDiagramPreviewCitationState] = useState<DiagramEvidenceCitation | null>(() =>
    readDiagramPreviewCitationFromUrl(),
  );
  const diagramPreviewCitationRef = useRef(diagramPreviewCitation);
  diagramPreviewCitationRef.current = diagramPreviewCitation;
  const syncDiagramCitationPreviewToUrl = useCallback(
    (citation: DiagramEvidenceCitation | null) => {
      commitHrefIfChanged(
        findingInspectDiagramCitationPreviewHrefFromSearch(readWindowLocationSearch(), citation, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setDiagramPreviewCitation = useCallback(
    (citation: DiagramEvidenceCitation | null) => {
      if (diagramPreviewCitationRef.current === citation) {
        return;
      }

      diagramPreviewCitationRef.current = citation;
      setDiagramPreviewCitationState(citation);
      syncDiagramCitationPreviewToUrl(citation);
    },
    [syncDiagramCitationPreviewToUrl],
  );
  const syncOpenCitationArtifactIdToUrl = useCallback(
    (artifactId: string | null) => {
      commitHrefIfChanged(
        findingInspectEvidenceCitationDisclosureHrefFromSearch(readWindowLocationSearch(), artifactId, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setOpenCitationArtifactId = useCallback(
    (artifactId: string | null) => {
      const next = artifactId ?? "";

      if (openCitationArtifactIdRef.current === next) {
        return;
      }

      openCitationArtifactIdRef.current = next;
      setOpenCitationArtifactIdState(next);
      syncOpenCitationArtifactIdToUrl(artifactId);
    },
    [syncOpenCitationArtifactIdToUrl],
  );
  useEffect(() => {
    const syncFromUrl = (): void => {
      const nextArtifactId = readOpenCitationArtifactIdFromUrl();

      if (openCitationArtifactIdRef.current !== nextArtifactId) {
        openCitationArtifactIdRef.current = nextArtifactId;
        setOpenCitationArtifactIdState(nextArtifactId);
      }

      const nextDiagramPreview = readDiagramPreviewCitationFromUrl();

      if (diagramPreviewCitationRef.current !== nextDiagramPreview) {
        diagramPreviewCitationRef.current = nextDiagramPreview;
        setDiagramPreviewCitationState(nextDiagramPreview);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  useEffect(() => {
    if (openCitationArtifactIdRef.current === urlOpenCitationArtifactId) {
      return;
    }

    openCitationArtifactIdRef.current = urlOpenCitationArtifactId;
    setOpenCitationArtifactIdState(urlOpenCitationArtifactId);
  }, [urlOpenCitationArtifactId]);

  useEffect(() => {
    if (diagramPreviewCitationRef.current === urlDiagramPreviewCitation) {
      return;
    }

    diagramPreviewCitationRef.current = urlDiagramPreviewCitation;
    setDiagramPreviewCitationState(urlDiagramPreviewCitation);
  }, [urlDiagramPreviewCitation]);

  const buyerPolishedShell = resolveProductionEvalChromeFromStorage();
  const policy = citationModel?.policy ?? null;
  const pack = citationModel?.pack ?? null;
  const hasPolicyContext = policy !== null;
  const sectionTitle = hasPolicyContext ? "Customer policy & evidence" : "Evidence citations";
  const evidenceHeading = hasPolicyContext ? "Supporting architecture evidence" : null;
  const citationListProps = {
    evidence,
    reviewContextHref,
    reviewContextLabel,
    buyerPolishedShell,
    citationEvidence: citationModel?.evidence,
    openCitationArtifactId,
    onCitationOpenChange: setOpenCitationArtifactId,
    pathname,
    searchParamsString,
  };

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-label={sectionTitle}
      data-testid="finding-inspect-evidence-section"
    >
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{sectionTitle}</h2>

      {hasPolicyContext ? (
        <FindingInspectPolicyRuleCallout pack={pack} policy={policy} className="mt-3" />
      ) : null}

      {evidenceHeading !== null ? (
        <h3 className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>
          {evidenceHeading}
        </h3>
      ) : null}

      {evidenceListReturned === false ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Evidence list was not stored.
        </p>
      ) : evidence.length === 0 ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Evidence list was stored empty.
        </p>
      ) : (
        <EvidenceCitationList {...citationListProps} />
      )}

      <FindingInspectDiagramCitationPreviewDialog
        runId={runId}
        citation={diagramPreviewCitation}
        open={diagramPreviewCitation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDiagramPreviewCitation(null);
          }
        }}
      />
    </section>
  );
}
