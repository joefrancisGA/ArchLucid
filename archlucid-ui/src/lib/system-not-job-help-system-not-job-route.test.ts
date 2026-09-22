import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_HANDOFF_MARKERS,
} from "@/lib/system-not-job-help-system-not-job-guide-content";
import {
  SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_PATH,
} from "@/lib/system-not-job-help-system-not-job-evidence-copy";
import { SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH } from "@/lib/system-not-job-help-system-not-job-route";

const UI_ROOT = join(process.cwd());
const REPO_ROOT = join(UI_ROOT, "..");

const HELP_TOPIC_VIEW_RESOLVER_OPERATE = join(
  UI_ROOT,
  "src/lib/help/help-topic-view-resolver-operate.tsx",
);

const PRODUCT_HANDOFF_SURFACES = [
  "archlucid-ui/src/lib/product-documentation-registry-entries-operator-workspace.ts",
  "archlucid-ui/src/lib/help/help-search-panel-catalog-topics.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-rows-operator.ts",
] as const;

function expectCanonicalHandoff(source: string): void {
  const hasHandoff = SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasHandoff).toBe(true);
}

describe("system-not-job-help-system-not-job-route (SN-032)", () => {
  it("uses the canonical /help/architecture-desk path", () => {
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH).toBe("/help/architecture-desk");
    expect(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_CANONICAL_PATH).toBe(SYSTEM_NOT_JOB_HELP_ARCHITECTURE_DESK_PATH);
  });

  it("registers the slug as an app-guided help topic", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("architecture-desk");
  });

  it("routes the slug through HelpArchitectureDeskGuideView", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_OPERATE, "utf8");

    expect(resolverSource).toContain('loaded.entry.slug === "architecture-desk"');
    expect(resolverSource).toContain("HelpArchitectureDeskGuideView");
  });

  it("keeps product handoffs on canonical /help/architecture-desk", () => {
    for (const relativePath of PRODUCT_HANDOFF_SURFACES) {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

      expectCanonicalHandoff(source);
    }
  });
});
