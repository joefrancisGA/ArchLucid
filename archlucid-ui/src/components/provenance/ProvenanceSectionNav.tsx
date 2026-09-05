"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  parseProvenanceSectionNavOpenFromSearch,
  provenanceSectionNavHrefFromSearch,
} from "@/lib/provenance/provenance-section-nav-url";

export type ProvenanceSection = {
  id: string;
  label: string;
};

type ProvenanceSectionNavProps = {
  readonly sections: readonly ProvenanceSection[];
  readonly placement: "inline-top" | "sidebar";
};

function useActiveProvenanceSection(sectionIds: readonly string[]): string {
  const [activeId, setActiveId] = useState<string>(sectionIds[0] ?? "");

  useEffect(() => {
    if (sectionIds.length === 0) {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0 || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visible.length === 0) {
          return;
        }

        const nextId = visible[0]?.target.id;

        if (nextId !== undefined && nextId.length > 0) {
          setActiveId(nextId);
        }
      },
      { rootMargin: "-12% 0px -58% 0px", threshold: [0, 0.15, 0.35, 0.55, 1] },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return activeId;
}

function ProvenanceSectionLinks(props: {
  readonly sections: readonly ProvenanceSection[];
  readonly activeId: string;
  readonly onNavigate?: () => void;
}): React.JSX.Element {
  return (
    <ul className={cn("m-0 list-none space-y-1.5 p-0", OPERATOR_TYPOGRAPHY.helper)}>
      {props.sections.map((section) => {
        const active = props.activeId === section.id;

        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "block rounded-md px-2 py-1 underline decoration-1 underline-offset-2",
                active
                  ? "bg-[var(--al-layer-hover)] font-semibold text-al-text-primary decoration-[var(--al-accent-interactive)] decoration-2 dark:bg-neutral-800/80"
                  : "text-neutral-600 decoration-neutral-300 hover:text-al-text-primary dark:text-neutral-400 dark:decoration-neutral-600 dark:hover:text-neutral-200",
              )}
              aria-current={active ? "location" : undefined}
              onClick={(event) => {
                event.preventDefault();
                props.onNavigate?.();
                document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {section.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/** Sticky in-page navigation with scroll-spy highlighting for the provenance page. */
export function ProvenanceSectionNav(props: ProvenanceSectionNavProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const provNavOpenParam = searchParams.get("provNavOpen");
  const sections = props.sections;
  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const activeId = useActiveProvenanceSection(sectionIds);
  const [mobileOpen, setMobileOpenState] = useState(() => parseProvenanceSectionNavOpenFromSearch(provNavOpenParam));
  const buyerStickyChrome = isBuyerPolishedOperatorShellEnv();

  const syncProvNavOpenToUrl = useCallback(
    (navOpen: boolean) => {
      router.replace(provenanceSectionNavHrefFromSearch(searchParams.toString(), navOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setMobileOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setMobileOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncProvNavOpenToUrl(next);

        return next;
      });
    },
    [syncProvNavOpenToUrl],
  );

  if (sections.length < 3) {
    return null;
  }

  if (props.placement === "inline-top") {
    return (
      <nav
        aria-label="On this page"
        className={cn(
          "sticky z-20 mb-4 w-full rounded-lg border border-neutral-200 bg-white/95 px-3 py-2 backdrop-blur dark:border-neutral-700 dark:bg-neutral-950/95 xl:hidden print:hidden",
          buyerStickyChrome ? "top-40 lg:top-44" : "top-16",
        )}
        data-testid="provenance-section-nav-mobile"
      >
        <button
          type="button"
          className={cn("flex w-full items-center justify-between text-left", OPERATOR_NAV_GROUP_LABEL)}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span>On this page</span>
          <span className="text-neutral-500">{mobileOpen ? "Hide" : "Show"}</span>
        </button>
        {mobileOpen ? (
          <div className="mt-2">
            <ProvenanceSectionLinks sections={sections} activeId={activeId} onNavigate={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </nav>
    );
  }

  return (
    <nav
      aria-label="On this page"
      className="hidden w-52 shrink-0 xl:sticky xl:top-24 xl:block xl:self-start print:hidden"
      data-testid="provenance-section-nav-desktop"
    >
      <p className={cn("m-0 mb-2 font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>
        On this page
      </p>
      <ProvenanceSectionLinks sections={sections} activeId={activeId} />
    </nav>
  );
}
