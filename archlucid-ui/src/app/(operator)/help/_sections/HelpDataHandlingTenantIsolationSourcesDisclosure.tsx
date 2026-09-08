"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { HelpDataHandlingTenantIsolationSourceLinks } from "@/app/(operator)/help/_sections/HelpDataHandlingTenantIsolationSourceLinks";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import {
  HELP_DATA_HANDLING_TENANT_ISOLATION_SOURCES_OPEN_PARAM,
  helpDataHandlingTenantIsolationSourcesDisclosureHrefFromSearch,
  parseHelpDataHandlingTenantIsolationSourcesOpenFromSearch,
} from "@/lib/help/help-data-handling-tenant-isolation-sources-disclosure-url";

/** Source links disclosure synced to `helpDataHandlingTenantIsolationSourcesOpen`. */
export function HelpDataHandlingTenantIsolationSourcesDisclosure(): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const helpDataHandlingTenantIsolationSourcesOpenParam = searchParams.get(
    HELP_DATA_HANDLING_TENANT_ISOLATION_SOURCES_OPEN_PARAM,
  );
  const [open, setOpenState] = useState(() =>
    parseHelpDataHandlingTenantIsolationSourcesOpenFromSearch(helpDataHandlingTenantIsolationSourcesOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        helpDataHandlingTenantIsolationSourcesDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
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
    setOpenState(
      parseHelpDataHandlingTenantIsolationSourcesOpenFromSearch(helpDataHandlingTenantIsolationSourcesOpenParam),
    );
  }, [helpDataHandlingTenantIsolationSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_DISCLOSURE_TITLE}
      summaryLine={DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO}
      sectionTestId="help-data-handling-tenant-isolation-source-disclosure"
      open={open}
      onToggle={setOpen}
    >
      <HelpDataHandlingTenantIsolationSourceLinks />
    </CollapsibleSection>
  );
}
