"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildDigestPreviewBeforeSubscribeSpecimen,
  DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE,
  DIGEST_PREVIEW_SPECIMEN_BADGE,
  resolveDigestPreviewHelper,
  type DigestPreviewBeforeSubscribeInput,
} from "@/lib/digest-preview-before-subscribe";
import { cn } from "@/lib/utils";

export type DigestPreviewBeforeSubscribePanelProps = DigestPreviewBeforeSubscribeInput & {
  readonly className?: string;
};

/**
 * In-app digest specimen shown before Subscribe / Save (TB-2211).
 */
export function DigestPreviewBeforeSubscribePanel(
  props: DigestPreviewBeforeSubscribePanelProps,
): ReactElement {
  const { className, ...input } = props;
  const specimen = buildDigestPreviewBeforeSubscribeSpecimen(input);
  const helper = resolveDigestPreviewHelper(input.variant);

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        className,
      )}
      data-testid="digest-preview-before-subscribe"
      aria-labelledby="digest-preview-before-subscribe-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id="digest-preview-before-subscribe-title"
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.cardTitle,
          )}
        >
          {DIGEST_PREVIEW_BEFORE_SUBSCRIBE_TITLE}
        </h3>
        <span
          className={cn(
            "rounded-sm border border-neutral-300 bg-white px-1.5 py-0.5 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="digest-preview-before-subscribe-badge"
        >
          {DIGEST_PREVIEW_SPECIMEN_BADGE}
        </span>
      </div>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{helper}</p>

      <div
        className="mt-3 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
        data-testid="digest-preview-before-subscribe-specimen"
      >
        <dl className="m-0 grid gap-2">
          <div>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Subject
            </dt>
            <dd
              className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="digest-preview-before-subscribe-subject"
            >
              {specimen.subjectLine}
            </dd>
          </div>
          <div>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              To
            </dt>
            <dd
              className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="digest-preview-before-subscribe-to"
            >
              {specimen.toLine}
            </dd>
          </div>
          <div>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Delivery
            </dt>
            <dd
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="digest-preview-before-subscribe-meta"
            >
              {specimen.metaLine}
            </dd>
          </div>
        </dl>

        <p className={cn("m-0 mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{specimen.bodyLead}</p>

        <p
          className={cn(
            "m-0 mt-3 font-medium text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {specimen.sectionsHeading}
        </p>
        <ul
          className={cn("m-0 mt-1 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digest-preview-before-subscribe-sections"
        >
          {specimen.sections.map((section) => (
            <li key={section}>{section}</li>
          ))}
        </ul>

        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{specimen.footnote}</p>
      </div>
    </section>
  );
}
