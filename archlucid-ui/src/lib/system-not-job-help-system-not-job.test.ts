import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_HELP_SOURCES,
  GETTING_STARTED_HELP_WORKING_SOURCES,
  resolveGettingStartedHelpSources,
} from "@/lib/getting-started-help-guide-content";
import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import { AO42_WORKING_HELP_DENYLIST } from "@/lib/help/help-workspace-mode-copy";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_SUBTITLE,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_TITLE,
  SYSTEM_NOT_JOB_HELP_WORKING_AUTHORITY_PIPELINE_MARKERS,
  SYSTEM_NOT_JOB_HELP_WORKING_TWO_START_PRODUCT_MARKERS,
} from "@/lib/system-not-job-help-system-not-job-guide-content";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_PATH,
} from "@/lib/system-not-job-help-system-not-job-evidence-copy";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH,
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SLUG,
} from "@/lib/system-not-job-help-system-not-job-route";

describe("system-not-job help architecture desk (SN-032)", () => {
  it("registers the architecture-desk slug and canonical /help path", () => {
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_SLUG).toBe("architecture-desk");
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH).toBe("/help/architecture-desk");
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_PATH).toBe("/help/architecture-desk");
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("architecture-desk");
  });

  it("teaches architecture identity and nested jobs without two-start evaluator IA", () => {
    const corpus = [
      SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_TITLE,
      SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PAGE_SUBTITLE,
      SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_OVERVIEW,
    ].join(" ");

    expect(corpus).toMatch(/named architecture/i);
    expect(corpus).toMatch(/nested/i);
    expect(corpus).not.toMatch(SYSTEM_NOT_JOB_HELP_WORKING_TWO_START_PRODUCT_MARKERS);
    expect(corpus).not.toMatch(SYSTEM_NOT_JOB_HELP_WORKING_AUTHORITY_PIPELINE_MARKERS);
    expect(corpus).not.toMatch(AO42_WORKING_HELP_DENYLIST);
  });

  it("routes Working getting-started diligence sources to architecture-desk instead of peer start products", () => {
    const workingSources = resolveGettingStartedHelpSources("architecture", true);

    expect(workingSources).toEqual(GETTING_STARTED_HELP_WORKING_SOURCES);
    expect(workingSources.some((link) => link.href.includes("architecture-desk"))).toBe(true);
    expect(workingSources.some((link) => link.href === "/architecture/reviews/new")).toBe(false);
    expect(workingSources.some((link) => link.href.includes("first-architecture-review"))).toBe(false);
    expect(workingSources.some((link) => link.href.includes("choose-your-next-step"))).toBe(false);

    const guidedSources = resolveGettingStartedHelpSources("architecture", false);

    expect(guidedSources).toEqual(GETTING_STARTED_HELP_SOURCES);
    expect(guidedSources.some((link) => link.href === "/architecture/reviews/new")).toBe(true);
  });
});
