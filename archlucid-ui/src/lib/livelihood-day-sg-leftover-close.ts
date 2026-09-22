/** LY leftover close: reuse existing SG/AO/SY/LW tests; do not re-run SG-001–081 product bodies. */
export type LivelihoodDayLeftoverCloseRoot = "ui-src" | "repo";

export type LivelihoodDaySgLeftoverCloseRow = {
  readonly lyPrompt: string;
  readonly relativeTestPath: string;
  readonly marker: string;
  readonly root?: LivelihoodDayLeftoverCloseRoot;
};

export const LIVELIHOOD_DAY_SG_LEFTOVER_CLOSE_ROWS: readonly LivelihoodDaySgLeftoverCloseRow[] = [
  {
    lyPrompt: "LY-021",
    relativeTestPath: "lib/resolve-working-findings-instrument-href.test.ts",
    marker: "SG-019",
  },
  {
    lyPrompt: "LY-022",
    relativeTestPath: "lib/architecture/finalize-success-desk-href.test.ts",
    marker: "AO-35",
  },
  {
    lyPrompt: "LY-023",
    relativeTestPath: "lib/system-gravity-instrument-after-spawn-guard.test.ts",
    marker: "SG-106",
  },
  {
    lyPrompt: "LY-024",
    relativeTestPath: "lib/architecture/working-back-href.test.ts",
    marker: "AO-44",
  },
  {
    lyPrompt: "LY-025",
    relativeTestPath: "lib/findings/finding-evidence-navigation.test.ts",
    marker: "SG-027",
  },
  {
    lyPrompt: "LY-026",
    relativeTestPath: "components/architecture/WorkingInstrumentDocumentTitle.test.tsx",
    marker: "SG-036",
  },
  {
    lyPrompt: "LY-027",
    relativeTestPath: "lib/architecture/architecture-nested-start-review-routes.test.ts",
    marker: "AO-22",
  },
  {
    lyPrompt: "LY-028",
    relativeTestPath: "lib/working-start-route.test.ts",
    marker: "AO-15",
  },
  {
    lyPrompt: "LY-029",
    relativeTestPath: "lib/system-not-job-reviews-hub-inbox-copy.test.ts",
    marker: "SN-011",
  },
  {
    lyPrompt: "LY-030",
    relativeTestPath: "lib/system-not-job-portfolio-resume-href.test.ts",
    marker: "SG-040",
  },
  {
    lyPrompt: "LY-031",
    relativeTestPath: "lib/system-gravity-wave32-batch2-guard.test.ts",
    marker: "SG-042",
  },
  {
    lyPrompt: "LY-032",
    relativeTestPath: "lib/resolve-continue-last-review-package.test.ts",
    marker: "SY-64",
  },
  {
    lyPrompt: "LY-033",
    relativeTestPath: "lib/reviews-hub-unfinished-work-href.test.ts",
    marker: "SY-54",
  },
  {
    lyPrompt: "LY-034",
    relativeTestPath: "lib/system-gravity-wave32-batch2-guard.test.ts",
    marker: "SG-048",
  },
  {
    lyPrompt: "LY-035",
    relativeTestPath: "lib/system-gravity-wave32-batch3-guard.test.ts",
    marker: "SG-050",
  },
  {
    lyPrompt: "LY-036",
    relativeTestPath: "lib/architecture/architecture-desk-shortcuts.test.ts",
    marker: "AO-43",
  },
  {
    lyPrompt: "LY-037",
    relativeTestPath: "lib/system-gravity-instrument-after-spawn-guard.test.ts",
    marker: "SG-052",
  },
  {
    lyPrompt: "LY-038",
    relativeTestPath: "lib/system-gravity-wave32-batch3-guard.test.ts",
    marker: "SG-053",
  },
  {
    lyPrompt: "LY-039",
    relativeTestPath: "lib/ux-audit-working-home-guard.test.ts",
    marker: "AO-46",
  },
  {
    lyPrompt: "LY-040",
    relativeTestPath: "lib/core-pilot-help-working-examples.test.ts",
    marker: "SG-056",
  },
  {
    lyPrompt: "LY-041",
    relativeTestPath: "lib/livelihood-day-draft-undo-inventory.test.ts",
    marker: "LY-041",
  },
  {
    lyPrompt: "LY-045",
    relativeTestPath: "lib/architecture/resolve-architecture-compare-defaults.test.ts",
    marker: "AO-29",
  },
  {
    lyPrompt: "LY-047",
    relativeTestPath: "components/architecture/ArchitectureIdentityDeskCompareAction.test.tsx",
    marker: "AO-29",
  },
  {
    lyPrompt: "LY-048",
    relativeTestPath: "lib/architecture/architecture-identity-current-draft.test.ts",
    marker: "spawn-locked",
  },
  {
    lyPrompt: "LY-049",
    relativeTestPath: "lib/architecture/architecture-draft-editing-help-guide-content.test.ts",
    marker: "keep mine",
  },
  {
    lyPrompt: "LY-050",
    relativeTestPath: "lib/architecture/architecture-draft-patch-cas.test.ts",
    marker: "expectedUpdatedUtc",
  },
  {
    lyPrompt: "LY-051",
    relativeTestPath: "lib/mutation-reversibility-registry.test.ts",
    marker: "300 seconds",
  },
  {
    lyPrompt: "LY-052",
    relativeTestPath: "lib/mutation-reversibility-registry.test.ts",
    marker: "300 seconds",
  },
  {
    lyPrompt: "LY-053",
    relativeTestPath: "lib/cheap-exploration-palette-sketch-a-change.test.ts",
    marker: "CE-013",
  },
  {
    lyPrompt: "LY-054",
    relativeTestPath: "components/architecture/architecture-draft-clone-snapshot.test.tsx",
    marker: "AO-36",
  },
  {
    lyPrompt: "LY-055",
    relativeTestPath: "lib/mutation-reversibility-registry.test.ts",
    marker: "cannot be unsealed",
  },
  {
    lyPrompt: "LY-060",
    relativeTestPath: "lib/lost-write-adr-guard.test.ts",
    marker: "expectedUpdatedUtc",
  },
  {
    lyPrompt: "LY-061",
    relativeTestPath: "lib/desk-continuity-architecture-locator.test.ts",
    marker: "AO-48",
  },
  {
    lyPrompt: "LY-062",
    relativeTestPath: "lib/working-start-route.test.ts",
    marker: "last-open-architecture",
  },
  {
    lyPrompt: "LY-063",
    relativeTestPath: "lib/architecture/working-share-href.test.ts",
    marker: "SG-034",
  },
  {
    lyPrompt: "LY-064",
    relativeTestPath: "lib/reviews/review-room-elicitation-url.test.ts",
    marker: "SY-21",
  },
  {
    lyPrompt: "LY-065",
    relativeTestPath: "components/architecture/ArchitectureDraftHandoffPanel.test.tsx",
    marker: "SG-049",
  },
  {
    lyPrompt: "LY-066",
    relativeTestPath: "lib/architecture/architecture-draft-editing-help-guide-content.test.ts",
    marker: "live occupancy",
  },
  {
    lyPrompt: "LY-068",
    relativeTestPath: "lib/architecture/architecture-draft-work-lease-copy.test.ts",
    marker: "execute lease",
  },
  {
    lyPrompt: "LY-069",
    relativeTestPath: "lib/architecture/architecture-draft-editing-help-guide-content.test.ts",
    marker: "not live presence",
  },
  {
    lyPrompt: "LY-070",
    relativeTestPath: "lib/architecture/architecture-draft-editing-help-guide-content.test.ts",
    marker: "draft-thread chat",
  },
  {
    lyPrompt: "LY-072",
    relativeTestPath: "components/architecture/ArchitectureIdentityDeskSealedReceiptStrip.test.ts",
    marker: "SG-023",
  },
  {
    lyPrompt: "LY-073",
    relativeTestPath:
      "ArchLucid.Architecture.Tests/ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests.cs",
    marker: "AS-066",
    root: "repo",
  },
  {
    lyPrompt: "LY-074",
    relativeTestPath: "lib/governance/simulator-career-honesty.test.ts",
    marker: "AS-068",
  },
  {
    lyPrompt: "LY-075",
    relativeTestPath: "lib/livelihood-day-sg-leftover-close.test.ts",
    marker: "sessionStorage",
  },
  {
    lyPrompt: "LY-077",
    relativeTestPath: "lib/findings/finding-semantic-support-band-export.test.ts",
    marker: "Remaining Unchecked",
  },
  {
    lyPrompt: "LY-078",
    relativeTestPath: "lib/findings/finding-semantic-support-band-export.test.ts",
    marker: "AS-071",
  },
  {
    lyPrompt: "LY-079",
    relativeTestPath: "lib/package-print-view.test.ts",
    marker: "AS-071",
  },
  {
    lyPrompt: "LY-082",
    relativeTestPath:
      "ArchLucid.Application.Tests/Pilots/FirstValueReportSemanticSupportBandSectionFormatterTests.cs",
    marker: "not LLM verified",
    root: "repo",
  },
  {
    lyPrompt: "LY-083",
    relativeTestPath: "lib/ask/ask-cited-findings-semantic-support-band.test.ts",
    marker: "TB-1003",
  },
  {
    lyPrompt: "LY-084",
    relativeTestPath: "components/architecture/ArchitectureIdentityDeskSealedReceiptStrip.test.ts",
    marker: "decision receipt",
  },
  {
    lyPrompt: "LY-085",
    relativeTestPath: "lib/package-print-view.test.ts",
    marker: "AS-071",
  },
  {
    lyPrompt: "LY-086",
    relativeTestPath: "lib/package-print-rehearsal-honesty.test.ts",
    marker: "CG-023",
  },
  {
    lyPrompt: "LY-087",
    relativeTestPath: "lib/governance/simulator-career-honesty.test.ts",
    marker: "AS-068",
  },
  {
    lyPrompt: "LY-088",
    relativeTestPath:
      "ArchLucid.Architecture.Tests/ArchitectureSpineAs066DoNotFuseInsightDensityArchitectureTests.cs",
    marker: "AS-066",
    root: "repo",
  },
  {
    lyPrompt: "LY-091",
    relativeTestPath: "lib/architecture/architecture-desk-shortcuts.test.ts",
    marker: "AO-43",
  },
  {
    lyPrompt: "LY-092",
    relativeTestPath: "lib/system-gravity-wave32-batch2-guard.test.ts",
    marker: "SG-028",
  },
  {
    lyPrompt: "LY-094",
    relativeTestPath: "lib/record-practice-adr-guard.test.ts",
    marker: "Record / Practice",
  },
  {
    lyPrompt: "LY-095",
    relativeTestPath: "lib/system-gravity-wave32-batch3-guard.test.ts",
    marker: "SG-054",
  },
  {
    lyPrompt: "LY-096",
    relativeTestPath: "components/architecture/ArchitectureIdentityDeskCommandBar.test.tsx",
    marker: "SG-055",
  },
  {
    lyPrompt: "LY-097",
    relativeTestPath: "lib/system-gravity-wave32-batch4-guard.test.ts",
    marker: "SG-081",
  },
  {
    lyPrompt: "LY-098",
    relativeTestPath: "lib/operator/operator-recent-views.test.ts",
    marker: "CA-38",
  },
  {
    lyPrompt: "LY-099",
    relativeTestPath: "lib/search/working-architecture-search-scope.test.ts",
    marker: "AO-32",
  },
  {
    lyPrompt: "LY-100",
    relativeTestPath: "lib/architecture/working-share-href.test.ts",
    marker: "SG-034",
  },
  {
    lyPrompt: "LY-101",
    relativeTestPath: "ArchLucid.Application.Tests/Operator/WorkingOperatorReviewLinksTests.cs",
    marker: "uses_nested_path_when_architecture_id_is_known",
    root: "repo",
  },
  {
    lyPrompt: "LY-102",
    relativeTestPath:
      "ArchLucid.Application.Tests/Notifications/Email/RecurrenceCompletionEmailDispatcherTests.cs",
    marker: "uses_nested_architecture_url_when_architecture_id_is_known",
    root: "repo",
  },
  {
    lyPrompt: "LY-103",
    relativeTestPath: "lib/system-gravity-wave32-batch5-guard.test.ts",
    marker: "SG-087",
  },
  {
    lyPrompt: "LY-104",
    relativeTestPath: "lib/system-not-job-help-system-not-job.test.ts",
    marker: "SG-080",
  },
  {
    lyPrompt: "LY-105",
    relativeTestPath: "lib/first-review-guide-status.test.ts",
    marker: "SG-045",
  },
];
