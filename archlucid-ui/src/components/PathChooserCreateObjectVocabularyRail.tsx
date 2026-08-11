"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildPathChooserCreateObjectVocabulary,
  resolvePathChooserCreateObjectLink,
  resolvePathChooserCreateObjectPeerLinks,
  type PathChooserCreateObjectSurfaceId,
  type PathChooserCreateObjectVocabularyModel,
} from "@/lib/path-chooser-create-object-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PathChooserCreateObjectVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peers. */
  readonly currentSurfaceId: PathChooserCreateObjectSurfaceId;
  /** Compact one-line strip (default) vs fuller why-three explanation with triad cards. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildPathChooserCreateObjectVocabulary}. */
  readonly model?: PathChooserCreateObjectVocabularyModel;
};

/**
 * TB-2260 — Triad vocabulary strip for path chooser, architecture drafts, and Start a review.
 * Mount on path-chooser help, drafts hub, and reviews/new chrome.
 */
export function PathChooserCreateObjectVocabularyRail(
  props: PathChooserCreateObjectVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildPathChooserCreateObjectVocabulary();
  const peers = resolvePathChooserCreateObjectPeerLinks(props.currentSurfaceId);
  const currentLink = resolvePathChooserCreateObjectLink(props.currentSurfaceId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="path-chooser-create-object-vocabulary"
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
              data-testid={`path-chooser-create-object-vocabulary-peer-${peer.id}`}
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
      aria-labelledby="path-chooser-create-object-vocabulary-heading"
      data-testid="path-chooser-create-object-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="path-chooser-create-object-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {[model.pathChooserLink, model.draftsLink, model.reviewsNewLink].map((job) => {
          const isCurrent = currentLink !== null && job.id === currentLink.id;

          if (isCurrent) {
            return (
              <div
                key={job.id}
                className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                data-testid={`path-chooser-create-object-vocabulary-job-${job.id}`}
              >
                <p
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
                  data-testid="path-chooser-create-object-vocabulary-current"
                  aria-current="page"
                >
                  {job.label}
                </p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {job.whenToUse}
                </p>
              </div>
            );
          }

          return (
            <div
              key={job.id}
              className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid={`path-chooser-create-object-vocabulary-job-${job.id}`}
            >
              <Link
                href={job.href}
                className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper, "font-medium")}
                data-testid={`path-chooser-create-object-vocabulary-peer-${job.id}`}
              >
                {job.label}
              </Link>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {job.whenToUse}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
