"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArchitectureStructuredNarrative } from "@/components/architecture/ArchitectureStructuredNarrative";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ARCHITECTURE_STRUCTURED_ASSERTED_LABEL,
  ARCHITECTURE_STRUCTURED_CORRECT_LABEL,
  ARCHITECTURE_STRUCTURED_INFERRED_LABEL,
  ARCHITECTURE_STRUCTURED_SECTION_EMPTY_LABEL,
} from "@/lib/architecture/architecture-structured-content-copy";
import {
  ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM,
  architectureStructuredSectionDisclosureHrefFromSearch,
  parseArchitectureStructuredSectionKeyFromSearch,
} from "@/lib/architecture/architecture-structured-section-disclosure-url";
import type { ArchitectureStructuredSection } from "@/lib/architecture/architecture-structured-content-types";
import { FINDINGS_ROW_METADATA_TAG_SIZE, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

export type ArchitectureStructuredSectionViewProps = {
  readonly section: ArchitectureStructuredSection;
  readonly defaultOpen?: boolean;
  readonly correctionHref: string | null;
};

function ProvenanceStatusTag(props: {
  readonly provenance: ArchitectureStructuredSection["provenance"];
}): React.JSX.Element {
  const isAsserted = props.provenance === "asserted";

  return (
    <StatusTag
      kind={isAsserted ? "ready" : "needs-attention"}
      label={isAsserted ? ARCHITECTURE_STRUCTURED_ASSERTED_LABEL : ARCHITECTURE_STRUCTURED_INFERRED_LABEL}
      className={FINDINGS_ROW_METADATA_TAG_SIZE}
      data-testid={`architecture-section-provenance-${props.provenance}`}
    />
  );
}

/** One structured architecture section with progressive disclosure. */
export function ArchitectureStructuredSectionView(
  props: ArchitectureStructuredSectionViewProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const readOpenSectionKeyFromUrl = (): string | null => {
    const param = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
      ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM,
    );

    if (param === null) {
      return null;
    }

    return parseArchitectureStructuredSectionKeyFromSearch(param);
  };
  const [openSectionKey, setOpenSectionKeyState] = useState(() =>
    parseArchitectureStructuredSectionKeyFromSearch(
      new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get(
        ARCHITECTURE_STRUCTURED_SECTION_KEY_PARAM,
      ),
    ),
  );
  const openSectionKeyRef = useRef(openSectionKey);
  openSectionKeyRef.current = openSectionKey;
  const syncOpenSectionKeyToUrl = useCallback(
    (sectionKey: string | null) => {
      commitHrefIfChanged(
        architectureStructuredSectionDisclosureHrefFromSearch(readWindowLocationSearch(), sectionKey, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setOpenSectionKey = useCallback(
    (sectionKey: string | null) => {
      const next = sectionKey ?? "";

      if (openSectionKeyRef.current === next) {
        return;
      }

      openSectionKeyRef.current = next;
      setOpenSectionKeyState(next);
      syncOpenSectionKeyToUrl(sectionKey);
    },
    [syncOpenSectionKeyToUrl],
  );
  const { section } = props;
  const hasNarrative = (section.narrativeMarkdown?.trim().length ?? 0) > 0;
  const hasEntities = section.entities.length > 0;
  const isEmpty = !hasNarrative && !hasEntities;
  const sectionOpen =
    openSectionKey === section.key || (openSectionKey === "" && props.defaultOpen === true);

  useEffect(() => {
    const syncOpenSectionKeyFromUrl = (): void => {
      const fromUrl = readOpenSectionKeyFromUrl();
      const next = fromUrl === null ? "" : fromUrl;

      if (openSectionKeyRef.current === next) {
        return;
      }

      openSectionKeyRef.current = next;
      setOpenSectionKeyState(next);
    };

    syncOpenSectionKeyFromUrl();
    window.addEventListener("popstate", syncOpenSectionKeyFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenSectionKeyFromUrl);
    };
  }, []);

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={`architecture-structured-section-${section.key}`}
      open={sectionOpen}
      onToggle={(event) => {
        event.preventDefault();
        setOpenSectionKey(sectionOpen ? null : section.key);
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {section.title}
        </span>
        <ProvenanceStatusTag provenance={section.provenance} />
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
            className={cn("inline-flex", OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`architecture-section-correct-${section.key}`}
          >
            {ARCHITECTURE_STRUCTURED_CORRECT_LABEL}
          </Link>
        ) : null}
      </div>
    </details>
  );
}
