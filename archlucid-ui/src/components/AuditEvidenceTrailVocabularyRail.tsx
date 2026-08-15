"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildAuditEvidenceTrailVocabulary,
  resolveAuditEvidenceTrailCurrentLink,
  resolveAuditEvidenceTrailPeerLinks,
  type AuditEvidenceTrailSurfaceId,
  type AuditEvidenceTrailVocabularyModel,
} from "@/lib/vocabulary/audit-evidence-trail-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AuditEvidenceTrailVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to peers. */
  readonly currentSurfaceId: AuditEvidenceTrailSurfaceId;
  /** Compact one-line strip (default) vs fuller why-three explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildAuditEvidenceTrailVocabulary}. */
  readonly model?: AuditEvidenceTrailVocabularyModel;
};

/**
 * TB-2255 — Compact vocabulary rail between Audit trail and evidence graph / search evidence.
 * Mount on Audit, Evidence graph, and Search review evidence.
 */
export function AuditEvidenceTrailVocabularyRail(
  props: AuditEvidenceTrailVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildAuditEvidenceTrailVocabulary();
  const peers = resolveAuditEvidenceTrailPeerLinks(props.currentSurfaceId);
  const currentLink = resolveAuditEvidenceTrailCurrentLink(props.currentSurfaceId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="audit-evidence-trail-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        {peers.map((peer, index) => (
          <span key={peer.id}>
            {index > 0 ? " · " : null}
            <Link
              href={peer.href}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid={`audit-evidence-trail-vocabulary-peer-${peer.id}`}
            >
              {peer.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="audit-evidence-trail-vocabulary-heading"
      data-testid="audit-evidence-trail-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="audit-evidence-trail-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="audit-evidence-trail-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        {peers.map((peer) => (
          <Link
            key={peer.id}
            href={peer.href}
            className={OPERATOR_LINK.optional}
            data-testid={`audit-evidence-trail-vocabulary-peer-${peer.id}`}
          >
            {peer.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
