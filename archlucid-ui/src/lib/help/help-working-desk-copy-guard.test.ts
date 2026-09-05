import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_HELP_WORKING_QUICK_START_COPY,
  GETTING_STARTED_HELP_WORKING_QUICK_START_TITLE,
} from "@/lib/getting-started-help-guide-content";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help/help-index.generated";
import {
  HELP_FIRST_SESSION_LEAD_MARKERS,
  HELP_WORKING_DESK_QUICK_START_COPY,
  HELP_WORKING_DESK_QUICK_START_TITLE,
  WORKING_HOME_HELP_SEARCH_EXCLUDED_TOPIC_IDS,
  WORKING_HOME_OPERATOR_HELP_SLUG,
} from "@/lib/help/help-workspace-mode-copy";
import { recommendedHelpSearchPanelTopicIds } from "@/lib/help/help-search-panel-catalog-recommend";

const HELP_GETTING_STARTED_VIEW_PATH =
  "src/app/(operator)/help/_sections/HelpGettingStartedGuideView.tsx";

const HELP_CORE_PILOT_VIEW_PATH =
  "src/app/(operator)/help/_sections/HelpCorePilotGuideView.tsx";

function readUiSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("help working desk copy guard (WA-04)", () => {
  it("keeps Working desk quick-start copy free of first-session lead markers", () => {
    for (const copy of [
      HELP_WORKING_DESK_QUICK_START_TITLE,
      HELP_WORKING_DESK_QUICK_START_COPY,
      GETTING_STARTED_HELP_WORKING_QUICK_START_TITLE,
      GETTING_STARTED_HELP_WORKING_QUICK_START_COPY,
    ]) {
      expect(copy, copy).not.toMatch(HELP_FIRST_SESSION_LEAD_MARKERS);
    }
  });

  it("routes Working home F1 to getting-started and filters onboarding search topics", () => {
    expect(WORKING_HOME_OPERATOR_HELP_SLUG).toBe("getting-started");
    expect(WORKING_HOME_HELP_SEARCH_EXCLUDED_TOPIC_IDS).toEqual(
      expect.arrayContaining(["first-review-guide", "create-first-review", "sample-review"]),
    );
  });

  it("wires workspace-mode resolvers into getting-started and core-pilot help views", () => {
    const gettingStartedSource = readUiSource(HELP_GETTING_STARTED_VIEW_PATH);
    const corePilotSource = readUiSource(HELP_CORE_PILOT_VIEW_PATH);

    expect(gettingStartedSource).toContain("useWorkspaceMode");
    expect(gettingStartedSource).toContain("resolveGettingStartedHelpQuickStartTitle");
    expect(gettingStartedSource).toContain("HELP_EVALUATING_ARCHITECTURE_SECTION_TITLE");

    expect(corePilotSource).toContain("useWorkspaceMode");
    expect(corePilotSource).toContain("resolveCorePilotHelpSummaryTitle");
    expect(corePilotSource).toContain("resolveHelpWorkingDeskPrimaryActions");
  });

  it("keeps CORE_PILOT help search excerpts free of first-session lead markers (SD-06)", () => {
    const corePilotRecords = HELP_DOC_SEARCH_RECORDS.filter((record) =>
      record.docPath.replace(/\\/g, "/").endsWith("docs/CORE_PILOT.md"),
    );

    expect(corePilotRecords.length).toBeGreaterThan(0);

    for (const record of corePilotRecords) {
      expect(record.excerpt, record.sectionHeading).not.toMatch(HELP_FIRST_SESSION_LEAD_MARKERS);
    }
  });

  it("filters first-session help recommendations on core-pilot routes in Working mode (SD-06)", () => {
    expect(recommendedHelpSearchPanelTopicIds("/help/first-architecture-review", null, true)).toEqual([
      "upload-evidence",
      "cloud-connections",
      "troubleshoot",
    ]);
  });
});
