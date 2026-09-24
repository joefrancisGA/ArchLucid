"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { cn } from "@/lib/utils";

import { CreateWorkItemButton } from "@/components/work-items/CreateWorkItemButton";
import {
  CREATE_WORK_ITEM_SECTION_HELPER,
  CREATE_WORK_ITEM_SECTION_TITLE,
} from "@/lib/create-work-item-copy";
import {
  ARCHITECTURE_CREATE_WORK_ITEM_OPEN_PARAM,
  architectureCreateWorkItemDisclosureHrefFromSearch,
  parseArchitectureCreateWorkItemOpenFromSearch,
} from "@/lib/architecture/architecture-create-work-item-disclosure-url";

export type ArchitectureCreateWorkItemSectionProps = {
  readonly runId: string;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly ownerLabel: string | null;
  readonly findings: readonly QuickDecisionFinding[];
};

/** Collapsed-by-default secondary work-management section on the architecture-creation review page. */
export function ArchitectureCreateWorkItemSection(
  props: ArchitectureCreateWorkItemSectionProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const [architectureCreateWorkItemOpen, setArchitectureCreateWorkItemOpenState] = useState(() =>
    parseArchitectureCreateWorkItemOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get(ARCHITECTURE_CREATE_WORK_ITEM_OPEN_PARAM),
    ),
  );
  const architectureCreateWorkItemOpenRef = useRef(architectureCreateWorkItemOpen);
  architectureCreateWorkItemOpenRef.current = architectureCreateWorkItemOpen;
  const syncArchitectureCreateWorkItemOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        architectureCreateWorkItemDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );
  const setArchitectureCreateWorkItemOpen = useCallback(
    (open: boolean) => {
      if (architectureCreateWorkItemOpenRef.current === open) {
        return;
      }

      architectureCreateWorkItemOpenRef.current = open;
      setArchitectureCreateWorkItemOpenState(open);
      syncArchitectureCreateWorkItemOpenToUrl(open);
    },
    [syncArchitectureCreateWorkItemOpenToUrl],
  );
  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseArchitectureCreateWorkItemOpenFromSearch(
        new URLSearchParams(window.location.search).get(ARCHITECTURE_CREATE_WORK_ITEM_OPEN_PARAM),
      );

      if (architectureCreateWorkItemOpenRef.current === next) {
        return;
      }

      architectureCreateWorkItemOpenRef.current = next;
      setArchitectureCreateWorkItemOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <details
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-workspace-disclosure
      data-testid="architecture-create-work-item-section"
      open={architectureCreateWorkItemOpen}
      onToggle={(event) => {
        event.preventDefault();
        setArchitectureCreateWorkItemOpen(!architectureCreateWorkItemOpenRef.current);
      }}
    >
      <summary className={cn("cursor-pointer list-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {CREATE_WORK_ITEM_SECTION_TITLE}
      </summary>
      <div className="mt-3 space-y-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {CREATE_WORK_ITEM_SECTION_HELPER}
        </p>
        <CreateWorkItemButton
          runId={props.runId}
          architectureName={props.architectureName}
          architectureOverview={props.architectureOverview}
          ownerLabel={props.ownerLabel}
          findings={props.findings}
          siteOrigin={siteOrigin}
        />
      </div>
    </details>
  );
}
