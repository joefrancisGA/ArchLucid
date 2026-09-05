"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runAgentForensicsOpenParam = searchParams.get("runAgentForensicsOpen");
  const [open, setOpenState] = useState(() => parseRunAgentForensicsOpenFromSearch(runAgentForensicsOpenParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runAgentForensicsDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunAgentForensicsOpenFromSearch(runAgentForensicsOpenParam));
  }, [runAgentForensicsOpenParam]);

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
