"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EVIDENCE_SOURCES_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";
import {
  projectsRecycleBinSourcesDisclosureHrefFromSearch,
  parseProjectsRecycleBinSourcesOpenFromSearch,
} from "@/lib/administration/projects-recycle-bin-sources-disclosure-url";
import {
  PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE,
  PROJECTS_RECYCLE_BIN_ORIENTATION_SOURCES_INTRO,
  PROJECTS_RECYCLE_BIN_SOURCES,
} from "@/lib/projects-recycle-bin-evidence-copy";
import { PROJECTS_RECYCLE_BIN_SETTINGS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/projects-recycle-bin-settings-page-copy";

/** Sources-only follow-ups for `/administration/workspace-settings/recycle-bin` buyer-polished shell (STR). */
export function ProjectsRecycleBinSourcesOrientationStrip(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const projectsRecycleBinSourcesOpenParam = searchParams.get("projectsRecycleBinSourcesOpen");
  const [sourcesOpen, setSourcesOpenState] = useState(() =>
    parseProjectsRecycleBinSourcesOpenFromSearch(projectsRecycleBinSourcesOpenParam),
  );

  const syncSourcesOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(projectsRecycleBinSourcesDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
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
    setSourcesOpenState(parseProjectsRecycleBinSourcesOpenFromSearch(projectsRecycleBinSourcesOpenParam));
  }, [projectsRecycleBinSourcesOpenParam]);

  return (
    <CollapsibleSection
      title={PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE}
      summaryLine={PROJECTS_RECYCLE_BIN_ORIENTATION_SOURCES_INTRO}
      sectionTestId={PROJECTS_RECYCLE_BIN_SETTINGS_ORIENTATION_BOTTOM_TEST_ID}
      open={sourcesOpen}
      onToggle={setSourcesOpen}
    >
      <EvidenceOrientationSourcesSection
        testId="projects-recycle-bin-settings-sources"
        headingId="projects-recycle-bin-settings-sources-heading"
        title={PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE}
        intro={PROJECTS_RECYCLE_BIN_ORIENTATION_SOURCES_INTRO}
        links={PROJECTS_RECYCLE_BIN_SOURCES}
        style={EVIDENCE_SOURCES_STYLE.operatorRaised}
        layout="columns"
      />
    </CollapsibleSection>
  );
}
