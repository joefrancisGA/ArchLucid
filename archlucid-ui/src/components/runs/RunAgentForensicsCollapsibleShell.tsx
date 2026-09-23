"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRunAgentForensicsOpenFromSearch,
  runAgentForensicsDisclosureHrefFromSearch,
} from "@/lib/runs/run-agent-forensics-disclosure-url";

type RunAgentForensicsCollapsibleShellProps = {
  readonly children: ReactNode;
};

/** Client collapsible wrapper for server-rendered agent forensics content. */
export function RunAgentForensicsCollapsibleShell(
  props: RunAgentForensicsCollapsibleShellProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const [open, setOpenState] = useState(() =>
    parseRunAgentForensicsOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runAgentForensicsOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runAgentForensicsDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const next = parseRunAgentForensicsOpenFromSearch(
        new URLSearchParams(window.location.search).get("runAgentForensicsOpen"),
      );

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  return (
    <CollapsibleSection
      title="Advanced — agent traces and structural evaluation (diagnostics)"
      open={open}
      onToggle={setOpen}
    >
      {props.children}
    </CollapsibleSection>
  );
}
