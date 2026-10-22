"use client";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { HelpConfigurationReferenceCatalogDisclosure } from "@/app/(operator)/help/_sections/HelpConfigurationReferenceCatalogDisclosure";
import { MarketingAccessibilityMarkdownFragment } from "@/components/marketing/MarketingAccessibilityMarkdownFragment";
import { Button } from "@/components/ui/button";
import {
  countConfigurationReferenceHelpCatalogKeys,
  filterConfigurationReferenceHelpCatalogMarkdown,
} from "@/lib/configuration-reference-help-catalog";
import {
  CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SECTION_ID,
  CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SUMMARY_LABEL,
} from "@/lib/configuration-reference-help-guide-content";
import {
  helpConfigurationReferenceCatalogFilterHrefFromSearch,
  parseHelpConfigurationReferenceCatalogFilterFromSearch,
} from "@/lib/help/help-configuration-reference-catalog-filter-url";
import { HELP_PAGE_LAYOUT, HELP_PAGE_TOC } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { cn } from "@/lib/utils";

type HelpConfigurationReferenceCatalogSectionProps = {
  readonly entry: ProductDocumentationEntry;
  readonly markdown: string;
  readonly sourceDocPath: string;
};

function readLocationHash(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash.replace(/^#/, "").trim();
}

function shouldOpenCatalogForHash(hash: string, markdown: string): boolean {
  if (hash.length === 0) {
    return false;
  }

  if (hash === CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SECTION_ID) {
    return true;
  }

  const normalizedHash = hash.toLowerCase();

  return markdown.toLowerCase().includes(`| ${normalizedHash} `) || markdown.toLowerCase().includes(`|${normalizedHash}|`);
}

function focusCatalogKeyRow(hash: string, container: HTMLElement | null): void {
  if (container === null || hash.length === 0 || hash === CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SECTION_ID) {
    return;
  }

  const normalizedHash = hash.toLowerCase();
  const rows = container.querySelectorAll("tbody tr");

  for (const row of rows) {
    if (!(row instanceof HTMLElement)) {
      continue;
    }
    const firstCell = row.querySelector("td, th");

    if (firstCell === null) {
      continue;
    }

    const cellText = firstCell.textContent?.trim().toLowerCase() ?? "";

    if (cellText === normalizedHash || cellText.includes(normalizedHash)) {
      if (!row.hasAttribute("tabindex")) {
        row.setAttribute("tabindex", "-1");
      }

      row.focus({ preventScroll: true });
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
  }
}

/** Searchable, counted configuration key catalog appendix. */
export function HelpConfigurationReferenceCatalogSection(
  props: HelpConfigurationReferenceCatalogSectionProps,
): ReactElement {
  const { entry, markdown, sourceDocPath } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/help/configuration-reference";
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("helpConfigurationReferenceCatalogFilter");
  const [filterQuery, setFilterQuery] = useState(() =>
    parseHelpConfigurationReferenceCatalogFilterFromSearch(filterParam),
  );
  const [contentContainer, setContentContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setFilterQuery(parseHelpConfigurationReferenceCatalogFilterFromSearch(filterParam));
  }, [filterParam]);

  const syncFilterToUrl = useCallback(
    (nextFilter: string) => {
      router.replace(
        helpConfigurationReferenceCatalogFilterHrefFromSearch(searchParams.toString(), nextFilter, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const totalKeyCount = useMemo(() => countConfigurationReferenceHelpCatalogKeys(markdown), [markdown]);
  const filteredMarkdown = useMemo(
    () => filterConfigurationReferenceHelpCatalogMarkdown(markdown, filterQuery),
    [filterQuery, markdown],
  );
  const visibleKeyCount = useMemo(
    () => countConfigurationReferenceHelpCatalogKeys(filteredMarkdown),
    [filteredMarkdown],
  );

  const syncHashFocus = useCallback(() => {
    const hash = readLocationHash();

    if (hash.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      focusCatalogKeyRow(hash, contentContainer);
    });
  }, [contentContainer]);

  useEffect(() => {
    syncHashFocus();
    window.addEventListener("hashchange", syncHashFocus);
    window.addEventListener("archlucid:help-hash-scroll", syncHashFocus);

    return () => {
      window.removeEventListener("hashchange", syncHashFocus);
      window.removeEventListener("archlucid:help-hash-scroll", syncHashFocus);
    };
  }, [syncHashFocus]);

  const initialOpenFromHash = shouldOpenCatalogForHash(readLocationHash(), markdown);

  return (
    <HelpConfigurationReferenceCatalogDisclosure
      id={CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SECTION_ID}
      className={cn(HELP_PAGE_LAYOUT.contentPanel, "scroll-mt-24")}
      summaryClassName={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      summary={`${CONFIGURATION_REFERENCE_HELP_KEY_CATALOG_SUMMARY_LABEL} (${totalKeyCount} keys)`}
      initialOpen={initialOpenFromHash}
      preface={
        <div className="mt-3 space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Collapsed by default so the first viewport stays a task guide. Expand only when you need a specific key
            name after using the settings CTAs above.
          </p>
          <label className="block">
            <span className="sr-only">Filter configuration keys</span>
            <input
              type="search"
              value={filterQuery}
              onChange={(event) => {
                const nextValue = event.target.value;
                setFilterQuery(nextValue);
                syncFilterToUrl(nextValue);
              }}
              placeholder="Filter keys"
              className={HELP_PAGE_TOC.referenceSearchInput}
              data-testid="help-configuration-reference-catalog-filter"
            />
          </label>
          <p
            className={HELP_PAGE_TOC.referenceSearchMeta}
            data-testid="help-configuration-reference-catalog-count"
            aria-live="polite"
          >
            {filterQuery.trim().length > 0
              ? `Showing ${visibleKeyCount} of ${totalKeyCount} keys`
              : `${totalKeyCount} keys`}
          </p>
          {filterQuery.trim().length > 0 && visibleKeyCount === 0 ? (
            <div
              className="rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700"
              data-testid="help-configuration-reference-catalog-zero-match"
              role="status"
            >
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                No keys match this filter.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                data-testid="help-configuration-reference-catalog-clear-filter"
                onClick={() => {
                  setFilterQuery("");
                  syncFilterToUrl("");
                }}
              >
                Clear filter
              </Button>
            </div>
          ) : null}
        </div>
      }
      bodyClassName={cn(HELP_PAGE_LAYOUT.contentColumn, "mt-4")}
      onBodyMount={(element) => {
        setContentContainer(element);
        syncHashFocus();
      }}
    >
      <MarketingAccessibilityMarkdownFragment
        markdownBody={filteredMarkdown}
        tableCaption={`${entry.title} reference table`}
        presentation="help"
        sourceDocPath={sourceDocPath}
        helpTopicSlug={entry.slug}
      />
    </HelpConfigurationReferenceCatalogDisclosure>
  );
}
