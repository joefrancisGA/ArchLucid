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
  awsCloudConnectionSourcesDisclosureHrefFromSearch,
  parseAwsCloudConnectionSourcesOpenFromSearch,
} from "@/lib/integrations/aws-cloud-connection-sources-disclosure-url";

import { AWS_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID } from "./aws-cloud-connection-page-copy";

/** Sources-only follow-ups for `/integrations/cloud-connections/aws` buyer-polished shell (INC). */
export function AwsCloudConnectionSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sourcesOpenParam = searchParams.get("awsCloudConnectionSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseAwsCloudConnectionSourcesOpenFromSearch(sourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(awsCloudConnectionSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseAwsCloudConnectionSourcesOpenFromSearch(sourcesOpenParam));
  }, [sourcesOpenParam]);

  return (
    <CollapsibleSection
      title={CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE}
      summaryLine={CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO}
      sectionTestId={AWS_CLOUD_CONNECTION_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="cloud-connections-aws-sources"
        headingId="where-to-go-next"
        title={CLOUD_PROVIDER_CONNECTION_FOLLOW_UPS_TITLE}
        intro={CLOUD_PROVIDER_CONNECTION_ORIENTATION_SOURCES_INTRO}
        links={cloudProviderConnectionSources("aws")}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
