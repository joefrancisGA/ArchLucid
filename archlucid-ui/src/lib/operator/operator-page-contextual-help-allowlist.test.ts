import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST,
  OPERATOR_PAGE_CONTEXTUAL_HELP_TB1666_EXEMPLAR_SURFACES,
} from "@/lib/operator/operator-page-contextual-help-allowlist";
import { OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES } from "@/lib/operator/operator-governance-sponsor-page-help-surfaces";
import { OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES } from "@/lib/operator/operator-integrations-page-help-surfaces";
import { OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES } from "@/lib/operator/operator-pilot-analysis-page-help-surfaces";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const SRC_ROOT = join(process.cwd(), "src");

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("operator-page-contextual-help-allowlist (TB-1670)", () => {
  it("merges TB-1666 exemplars with TB-1667–TB-1669 mount waves", () => {
    const expectedLength =
      OPERATOR_PAGE_CONTEXTUAL_HELP_TB1666_EXEMPLAR_SURFACES.length
      + OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES.length
      + OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES.length
      + OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES.length;

    expect(OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST).toHaveLength(expectedLength);
    expect(OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST.map((entry) => entry.id)).toEqual([
      ...OPERATOR_PAGE_CONTEXTUAL_HELP_TB1666_EXEMPLAR_SURFACES.map((entry) => entry.id),
      ...OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES.map((entry) => entry.id),
      ...OPERATOR_GOVERNANCE_SPONSOR_PAGE_HELP_TB1668_SURFACES.map((entry) => entry.id),
      ...OPERATOR_INTEGRATIONS_PAGE_HELP_TB1669_SURFACES.map((entry) => entry.id),
    ]);
  });

  it.each(
    OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST.map((entry) => [
      entry.id,
      entry.pathname,
    ]),
  )("%s resolves a non-null page help topic for %s", (_id, pathname) => {
    const topic = pageHelpTopicForPathname(pathname);

    expect(topic).not.toBeNull();
    expect(topic?.label?.length).toBeGreaterThan(0);
  });

  it.each(
    OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST.map((entry) => [
      entry.id,
      entry.modulePath,
    ]),
  )("%s mounts PageContextualHelpButton in %s", (_id, modulePath) => {
    const source = readSrcModule(modulePath);

    expect(source).toContain("PageContextualHelpButton");
  });

  it("alerts hub maps to alerts, not governance-approval (TB-1670)", () => {
    expect(pageHelpTopicForPathname("/governance/alerts")?.slug).toBe("alerts");
    expect(pageHelpTopicForPathname("/governance")?.slug).toBe("governance-approval");
  });

  it("uses unique allowlist ids and pathnames", () => {
    const ids = OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST.map((entry) => entry.id);
    const pathnames = OPERATOR_PAGE_CONTEXTUAL_HELP_ALLOWLIST.map((entry) => entry.pathname);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(pathnames).size).toBe(pathnames.length);
  });
});
