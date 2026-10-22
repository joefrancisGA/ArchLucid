"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_LINES,
  ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE,
} from "@/lib/architecture-scorecard-help-guide-content";
import {
  helpArchitectureScorecardWorkedExampleDisclosureHrefFromSearch,
  parseHelpArchitectureScorecardWorkedExampleOpenFromSearch,
} from "@/lib/help/help-architecture-scorecard-worked-example-disclosure-url";
import { cn } from "@/lib/utils";

/** Worked example disclosure on `/help/architecture-scorecard` synced to URL. */
export function HelpArchitectureScorecardWorkedExampleDisclosure(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/help/architecture-scorecard";
  const searchParams = useSearchParams();
  const helpArchitectureScorecardWorkedExampleOpenParam = searchParams.get("helpArchitectureScorecardWorkedExampleOpen");
  const [open, setOpenState] = useState(() =>
    parseHelpArchitectureScorecardWorkedExampleOpenFromSearch(helpArchitectureScorecardWorkedExampleOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpArchitectureScorecardWorkedExampleDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
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
    setOpenState(parseHelpArchitectureScorecardWorkedExampleOpenFromSearch(helpArchitectureScorecardWorkedExampleOpenParam));
  }, [helpArchitectureScorecardWorkedExampleOpenParam]);

  return (
    <details
      className={HELP_PAGE_LAYOUT.details}
      data-testid="help-architecture-scorecard-worked-example"
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_TITLE}
      </summary>
      <ul className={cn(HELP_PAGE_LAYOUT.detailsBody, "m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {ARCHITECTURE_SCORECARD_HELP_WORKED_EXAMPLE_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}
