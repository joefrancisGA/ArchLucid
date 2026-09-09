"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  tenantSettingsSourcesDisclosureHrefFromSearch,
  parseTenantSettingsSourcesOpenFromSearch,
} from "@/lib/administration/tenant-settings-sources-disclosure-url";
import {
  TENANT_SETTINGS_FOLLOW_UPS_TITLE,
  TENANT_SETTINGS_ORIENTATION_SOURCES_INTRO,
  TENANT_SETTINGS_SOURCES,
} from "@/lib/tenant-settings-evidence-copy";
import { TENANT_SETTINGS_SETTINGS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/tenant-settings-settings-page-copy";

/** Sources-only follow-ups for `/administration/workspace-settings` buyer-polished shell (ATE). */
export function TenantSettingsSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const tenantSettingsSourcesOpenParam = searchParams.get("tenantSettingsSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseTenantSettingsSourcesOpenFromSearch(tenantSettingsSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(tenantSettingsSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setSourcesOpen = useCallback(
    (open: boolean) => {
      setSourcesOpenState(open);
      syncSourcesOpenToUrl(open);
    },
    [syncSourcesOpenToUrl],
  );

  useEffect(() => {
    setSourcesOpenState(parseTenantSettingsSourcesOpenFromSearch(tenantSettingsSourcesOpenParam));
  }, [tenantSettingsSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={TENANT_SETTINGS_FOLLOW_UPS_TITLE}
      summaryLine={TENANT_SETTINGS_ORIENTATION_SOURCES_INTRO}
      sectionTestId={TENANT_SETTINGS_SETTINGS_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="tenant-settings-settings-sources"
        headingId="tenant-settings-settings-sources-heading"
        title={TENANT_SETTINGS_FOLLOW_UPS_TITLE}
        intro={TENANT_SETTINGS_ORIENTATION_SOURCES_INTRO}
        links={TENANT_SETTINGS_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
