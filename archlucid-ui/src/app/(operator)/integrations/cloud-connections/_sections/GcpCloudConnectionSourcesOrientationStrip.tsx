"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE,
  CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";
import {
  gcpCloudConnectionSourcesDisclosureHrefFromSearch,
  parseGcpCloudConnectionSourcesOpenFromSearch,
} from "@/lib/integrations/gcp-cloud-connection-sources-disclosure-url";

import { GCP_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID } from "./gcp-cloud-connection-page-copy";

/** Sources-only follow-ups for `/integrations/cloud-connections/gcp` buyer-polished shell (IGC). */
export function GcpCloudConnectionSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("gcpCloudConnectionSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseGcpCloudConnectionSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(gcpCloudConnectionSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseGcpCloudConnectionSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE}
      summaryLine={CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO}
      sectionTestId={GCP_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="cloud-connections-gcp-sources"
        headingId="where-to-go-next"
        title={CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE}
        intro={CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO}
        links={cloudProviderConnectionSources("gcp")}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
