"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseSponsorRehearsalPreviewOpenFromSearch,
  sponsorRehearsalPreviewDisclosureHrefFromSearch,
} from "@/lib/reviews/sponsor-rehearsal-preview-disclosure-url";
import {
  buildSponsorRehearsalPreview,
  type SponsorRehearsalPreviewInput,
} from "@/lib/sponsor-rehearsal-preview";
import { cn } from "@/lib/utils";

export type SponsorRehearsalPreviewPanelProps = {
  readonly input?: SponsorRehearsalPreviewInput | null;
  readonly className?: string;
  /** When false, content is always visible (no disclosure). Default true. */
  readonly collapsedByDefault?: boolean;
};

/**
 * Preview-as-sponsor rehearsal mode (TB-2208).
 * Shows the four sponsor-facing sections operators should review before send.
 */
export function SponsorRehearsalPreviewPanel(
  props: SponsorRehearsalPreviewPanelProps,
): ReactElement {
  const collapsedByDefault = props.collapsedByDefault !== false;
  const pathname = usePathname() ?? "/";
  const [panelOpen, setPanelOpenState] = useState(() =>
    parseSponsorRehearsalPreviewOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("sponsorRehearsalPreviewOpen"),
    ),
  );
  const panelOpenRef = useRef(panelOpen);
  panelOpenRef.current = panelOpen;

  const syncPanelOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        sponsorRehearsalPreviewDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setPanelOpen = useCallback(
    (open: boolean) => {
      if (panelOpenRef.current === open) {
        return;
      }

      panelOpenRef.current = open;
      setPanelOpenState(open);
      syncPanelOpenToUrl(open);
    },
    [syncPanelOpenToUrl],
  );

  useEffect(() => {
    const syncPanelOpenFromUrl = (): void => {
      const next = parseSponsorRehearsalPreviewOpenFromSearch(
        new URLSearchParams(window.location.search).get("sponsorRehearsalPreviewOpen"),
      );

      if (panelOpenRef.current === next) {
        return;
      }

      panelOpenRef.current = next;
      setPanelOpenState(next);
    };

    syncPanelOpenFromUrl();
    window.addEventListener("popstate", syncPanelOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPanelOpenFromUrl);
    };
  }, []);

  const preview = buildSponsorRehearsalPreview(props.input ?? {});

  const body = (
    <div className="space-y-3" data-testid="sponsor-rehearsal-preview-body">
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="sponsor-rehearsal-preview-caution"
      >
        {preview.caution}
      </p>
      {preview.sections.map((section) => (
        <section
          key={section.id}
          className="space-y-1"
          data-testid={`sponsor-rehearsal-section-${section.id}`}
          data-empty={section.isEmpty ? "true" : "false"}
        >
          <h3 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            {section.title}
          </h3>
          <p
            className={cn(
              "m-0 whitespace-pre-wrap text-al-text-primary",
              OPERATOR_TYPOGRAPHY.body,
              section.isEmpty ? "text-al-text-secondary" : null,
            )}
          >
            {section.body}
          </p>
        </section>
      ))}
    </div>
  );

  if (!collapsedByDefault) {
    return (
      <section
        className={cn(
          "rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800",
          props.className,
        )}
        data-testid="sponsor-rehearsal-preview"
        aria-label="Preview as sponsor"
      >
        <p className={cn("m-0 mb-2 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Preview as sponsor
        </p>
        {body}
      </section>
    );
  }

  return (
    <details
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      data-testid="sponsor-rehearsal-preview"
      open={panelOpen}
      onToggle={(event) => {
        event.preventDefault();
        setPanelOpen(!panelOpenRef.current);
      }}
    >
      <summary
        className={cn("cursor-pointer select-none font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      >
        Preview as sponsor
      </summary>
      <div className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">{body}</div>
    </details>
  );
}
