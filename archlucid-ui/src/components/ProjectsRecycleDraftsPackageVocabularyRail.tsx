"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildProjectsRecycleDraftsPackageVocabulary,
  resolveProjectsRecycleDraftsPackageLink,
  resolveProjectsRecycleDraftsPackagePeerLinks,
  type ProjectsRecycleDraftsPackageSurfaceId,
  type ProjectsRecycleDraftsPackageVocabularyModel,
} from "@/lib/vocabulary/projects-recycle-drafts-package-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ProjectsRecycleDraftsPackageVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peers. */
  readonly currentSurfaceId: ProjectsRecycleDraftsPackageSurfaceId;
  /** Compact one-line strip (default) vs fuller why-three explanation with triad cards. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildProjectsRecycleDraftsPackageVocabulary}. */
  readonly model?: ProjectsRecycleDraftsPackageVocabularyModel;
};

/**
 * TB-2251 — Triad vocabulary strip for recycle bin, architecture drafts, and architecture packages.
 * Mount on recycle + drafts hubs (skip noisy package detail mounts).
 */
export function ProjectsRecycleDraftsPackageVocabularyRail(
  props: ProjectsRecycleDraftsPackageVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildProjectsRecycleDraftsPackageVocabulary();
  const peers = resolveProjectsRecycleDraftsPackagePeerLinks(props.currentSurfaceId);
  const currentLink = resolveProjectsRecycleDraftsPackageLink(props.currentSurfaceId);

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="projects-recycle-drafts-package-vocabulary"
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
              data-testid={`projects-recycle-drafts-package-vocabulary-peer-${peer.id}`}
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
      aria-labelledby="projects-recycle-drafts-package-vocabulary-heading"
      data-testid="projects-recycle-drafts-package-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="projects-recycle-drafts-package-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyThree}
      </p>
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="projects-recycle-drafts-package-vocabulary-honesty"
      >
        {model.restoreResidueHonesty}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {[model.recycleLink, model.draftsLink, model.packageLink].map((job) => {
          const isCurrent = currentLink !== null && job.id === currentLink.id;

          if (isCurrent) {
            return (
              <div
                key={job.id}
                className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
                data-testid={`projects-recycle-drafts-package-vocabulary-job-${job.id}`}
              >
                <p
                  className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
                  data-testid="projects-recycle-drafts-package-vocabulary-current"
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
              data-testid={`projects-recycle-drafts-package-vocabulary-job-${job.id}`}
            >
              <Link
                href={job.href}
                className={cn(OPERATOR_LINK.optional, "font-medium")}
                data-testid={`projects-recycle-drafts-package-vocabulary-peer-${job.id}`}
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
