"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRunAgentForensicsOpenFromSearch,
  RUN_AGENT_FORENSICS_OPEN_PARAM,
  runAgentForensicsDisclosureHrefFromSearch,
} from "@/lib/runs/run-agent-forensics-disclosure-url";

type RunAgentForensicsCollapsibleShellProps = {
  readonly children: ReactNode;
  readonly serverRenderId: string;
};

/** Client collapsible wrapper for server-rendered agent forensics content. */
export function RunAgentForensicsCollapsibleShell(
  { children, serverRenderId }: RunAgentForensicsCollapsibleShellProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [open, setOpenState] = useState(false);
  const [previousRenderId, setPreviousRenderId] = useState<string | null>(null);
  const openRef = useRef(false);

  const changeOpen = useCallback(
    (detailsOpen: boolean, updateUrl: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      if (detailsOpen) {
        // Opening must not display a previously authorized RSC payload.
        setPreviousRenderId(serverRenderId);
      }
      setOpenState(detailsOpen);
      if (updateUrl) {
        commitHrefIfChanged(
          runAgentForensicsDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
          { notify: false },
        );
      }
      if (detailsOpen) {
        router.refresh();
      }
    },
    [pathname, router, serverRenderId],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      changeOpen(
        parseRunAgentForensicsOpenFromSearch(
          new URLSearchParams(window.location.search).get(RUN_AGENT_FORENSICS_OPEN_PARAM),
        ),
        false,
      );
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, [changeOpen]);

  return (
    <CollapsibleSection
      title="Advanced — agent traces and structural evaluation (diagnostics)"
      open={open}
      onToggle={(detailsOpen) => changeOpen(detailsOpen, true)}
    >
      {open && (
        previousRenderId === serverRenderId
          ? <p role="status">Checking current access…</p>
          : children
      )}
    </CollapsibleSection>
  );
}
