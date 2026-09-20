import { describe, expect, it } from "vitest";

import {
  resolveDataHandlingTenantIsolationHelpClaimDiscipline,
  resolveDataHandlingTenantIsolationHelpSourcesIntro,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { dataHandlingTenantIsolationHelpLeavesStaysHelper } from "@/lib/data-handling-tenant-isolation-help-guide-content";
import {
  resolveGettingStartedHelpClaimDiscipline,
  resolveGettingStartedHelpPlainLanguageTerms,
  resolveGettingStartedHelpPlainLanguageVocabIntro,
  resolveGettingStartedHelpTechnicalTerms,
} from "@/lib/getting-started-help-guide-content";
import {
  findingsHelpAnatomyFields,
  findingsHelpProvenanceNonClaim,
  findingsHelpRoleGuidance,
  findingsHelpSemanticSupportCopy,
} from "@/lib/findings/findings-help-guide-content";
import {
  resolveFindingsHelpClaimDiscipline,
  resolveFindingsHelpSources,
} from "@/lib/findings/findings-help-evidence-copy";
import { localizeHelpSearchPanelTopic } from "@/lib/help/help-product-copy";
import { START_HERE_TOPICS } from "@/lib/help/help-search-panel-catalog-topics";

const ARCHITECTURE_REVIEW_LEAK_MARKERS = [
  "finalized review",
  "architecture review",
  "sealed review",
  "review evidence",
  "search review evidence",
  "record finalize",
  "block seal",
] as const;

function collectSecureNowHelpStrings(): string[] {
  const dataHandlingHelp = START_HERE_TOPICS.find((topic) => topic.id === "data-handling-help");

  return [
    resolveDataHandlingTenantIsolationHelpClaimDiscipline("security"),
    resolveDataHandlingTenantIsolationHelpSourcesIntro("security"),
    dataHandlingTenantIsolationHelpLeavesStaysHelper("security"),
    resolveGettingStartedHelpClaimDiscipline("security"),
    resolveGettingStartedHelpPlainLanguageVocabIntro("security"),
    ...resolveGettingStartedHelpPlainLanguageTerms("security").flatMap((term) => [term.term, term.definition]),
    ...resolveGettingStartedHelpTechnicalTerms(false, "security").flatMap((term) => [term.term, term.definition]),
    resolveFindingsHelpClaimDiscipline("security"),
    ...resolveFindingsHelpSources("security").flatMap((source) => [source.label, source.href]),
    ...findingsHelpAnatomyFields("security").map((field) => field.description),
    ...findingsHelpRoleGuidance("security").flatMap((entry) => [entry.role, entry.guidance]),
    findingsHelpSemanticSupportCopy("security"),
    findingsHelpProvenanceNonClaim("security"),
    dataHandlingHelp
      ? localizeHelpSearchPanelTopic(dataHandlingHelp, "security").description
      : "",
  ];
}

describe("SecureNow review-language leak guard", () => {
  it("keeps P0 SecureNow help surfaces free of architecture-review leakage markers", () => {
    const secureNowStrings = collectSecureNowHelpStrings();

    for (const marker of ARCHITECTURE_REVIEW_LEAK_MARKERS) {
      const matches = secureNowStrings.filter((value) => value.toLowerCase().includes(marker));

      expect(matches, `unexpected "${marker}" in: ${matches.join(" | ")}`).toEqual([]);
    }
  });

  it("keeps architecture help strings available for the architecture product line", () => {
    expect(resolveFindingsHelpClaimDiscipline("architecture")).toContain("architecture concerns");
    expect(resolveGettingStartedHelpClaimDiscipline("architecture")).toContain("review flow");
  });
});
