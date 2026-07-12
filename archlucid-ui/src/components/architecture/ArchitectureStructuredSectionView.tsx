"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { ArchitectureStructuredNarrative } from "@/components/architecture/ArchitectureStructuredNarrative";
import {
  ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
  ARCHITECTURE_STRUCTURED_CORRECT_LABEL,
  ARCHITECTURE_STRUCTURED_INFERRED_LABEL,
  ARCHITECTURE_STRUCTURED_SECTION_EMPTY_LABEL,
} from "@/lib/architecture-structured-content-copy";
import type { ArchitectureStructuredSection } from "@/lib/architecture-structured-content-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureStructuredSectionViewProps = {
  readonly section: ArchitectureStructuredSection;
  readonly defaultOpen?: boolean;
  readonly correctionHref: string | null;
};

function ProvenanceBadge(props: { readonly provenance: ArchitectureStructuredSection["provenance"] }): React.JSX.Element {
  const label = props.provenance === "asserted" ? ARCHITECTURE_STRUCTURED_ASSERTED_LABEL : ARCHITECTURE_STRUCTURED_INFERRED_LABEL;

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wide",
        props.provenance === "asserted"
          ? "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200"
          : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
      )}
      data-testid={`architecture-section-provenance-${props.provenance}`}
    >
      {label}
    </span>
  );
}

/** One structured architecture section with progressive disclosure. */
export function ArchitectureStructuredSectionView(
  props: ArchitectureStructuredSectionViewProps,
): React.JSX.Element {
  const { section } = props;
  const hasNarrative = (section.narrativeMarkdown?.trim().length ?? 0) > 0;
  const hasEntities = section.entities.length > 0;
  const isEmpty = !hasNarrative && !hasEntities;

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={`architecture-structured-section-${section.key}`}
      open={props.defaultOpen === true}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {section.title}
        </span>
        <ProvenanceBadge provenance={section.provenance} />
      </summary>

      <div className="mt-3 space-y-3">
        {isEmpty ? (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {ARCHITECTURE_STRUCTURED_SECTION_EMPTY_LABEL}
          </p>
        ) : null}

        {hasNarrative && section.narrativeMarkdown !== null ? (
          <ArchitectureStructuredNarrative markdown={section.narrativeMarkdown} />
        ) : null}

        {hasEntities ? (
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2" data-testid="architecture-structured-entity-list">
            {section.entities.map((entity) => (
              <li
                key={`${section.key}-${entity.label}-${entity.detail ?? ""}`}
                className="rounded-md border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                    {entity.label}
                  </p>
                  {entity.provenance === "inferred" ? (
                    <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      {ARCHITECTURE_STRUCTURED_INFERRED_LABEL}
                    </span>
                  ) : null}
                </div>
                {entity.detail !== null && entity.detail.length > 0 ? (
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {entity.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {section.provenance === "inferred" && props.correctionHref !== null ? (
          <Link
            href={props.correctionHref}
            className={cn(
              "inline-flex font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid={`architecture-section-correct-${section.key}`}
          >
            {ARCHITECTURE_STRUCTURED_CORRECT_LABEL}
          </Link>
        ) : null}
      </div>
    </details>
  );
}
