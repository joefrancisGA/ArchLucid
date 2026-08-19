import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_HELP_TOPIC_LABEL } from "@/lib/advisory-scans-help-evidence-copy";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { contextualHelpForPathname } from "@/lib/contextual-help-registry";
import { DECISION_REGISTER_HELP_TOPIC_LABEL } from "@/lib/decision-register-help-evidence-copy";
import { IMPACT_PREVIEW_HELP_TOPIC_LABEL } from "@/lib/impact-preview-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL } from "@/lib/improvement-planning-help-evidence-copy";
import {
  isGenericLearnMoreSlug,
  LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS,
} from "@/lib/learn-more-job-match-inventory";
import { WORKSPACE_SETTINGS_HELP_TOPIC_LABEL } from "@/lib/tenant-settings-evidence-copy";
import { WHY_ARCHLUCID_HELP_TOPIC_LABEL } from "@/lib/why-archlucid-evidence-copy";
import {
  PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES,
  pageHelpTopicForPathname,
} from "@/lib/usability/page-help-topic-map";

/** TB-2050 remap paths — subset of TB-2052 inventory (excludes Digests golden covered elsewhere). */
const SECONDARY_HUB_PATHS = LEARN_MORE_JOB_MATCH_SECONDARY_HUB_PATHS.filter(
  (path) => path !== "/architecture/digests" && path !== "/digests",
);

describe("TB-2050 secondary-hub Learn more remap", () => {
  it("bans generic getting-started Learn more on secondary hubs", () => {
    for (const path of SECONDARY_HUB_PATHS) {
      const topic = pageHelpTopicForPathname(path);
      const slug = topic?.slug;

      expect(isGenericLearnMoreSlug(slug), path).toBe(false);
    }
  });

  it("maps secondary hubs to specialty help topics with descriptive labels", () => {
    expect(pageHelpTopicForPathname("/insights/improvement-planning")).toEqual({
      slug: "improvement-planning",
      label: IMPROVEMENT_PLANNING_HELP_TOPIC_LABEL,
    });
    expect(pageHelpTopicForPathname("/governance/decision-register")).toEqual({
      slug: "decision-register",
      label: DECISION_REGISTER_HELP_TOPIC_LABEL,
    });
    expect(pageHelpTopicForPathname("/governance/advisory-scans")).toEqual({
      slug: "advisory-scans",
      label: ADVISORY_SCANS_HELP_TOPIC_LABEL,
    });
    expect(pageHelpTopicForPathname("/insights/impact-preview")).toEqual({
      slug: "impact-preview",
      label: IMPACT_PREVIEW_HELP_TOPIC_LABEL,
    });
  });

  it("documents first-run allowlist prefixes for generic Learn more", () => {
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/architectures");
    expect(PAGE_HELP_FIRST_RUN_GENERIC_LEARN_MORE_ALLOWLIST_PREFIXES).toContain("/why-archlucid");
    expect(pageHelpTopicForPathname("/architectures")).toEqual({
      slug: "architecture-drafts",
      label: ARCHITECTURE_DRAFTS_LIST_LABEL,
    });
    expect(pageHelpTopicForPathname("/why-archlucid")).toEqual({
      slug: "getting-started",
      hashFragment: "how-archlucid-works",
      label: WHY_ARCHLUCID_HELP_TOPIC_LABEL,
    });
  });

  it("remaps tenant settings and recommendation-learning off getting-started", () => {
    expect(pageHelpTopicForPathname("/administration/workspace-settings")).toEqual({
      slug: "workspace-settings",
      label: WORKSPACE_SETTINGS_HELP_TOPIC_LABEL,
    });
    expect(pageHelpTopicForPathname("/internal/recommendation-learning")?.slug).toBe(
      "pilot-feedback",
    );
  });

  it("keeps Category-1 registry coverage for secondary hubs", () => {
    for (const path of SECONDARY_HUB_PATHS) {
      expect(contextualHelpForPathname(path), path).not.toBeNull();
    }
  });
});
