import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_PATH } from "@/lib/architecture/architecture-draft-editing-help-evidence-copy";
import { ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_HANDOFF_MARKERS } from "@/lib/architecture/architecture-draft-editing-help-guide-content";
import { ARCHITECTURE_DRAFT_EDITING_HELP_PATH } from "@/lib/architecture/architecture-draft-editing-help-route";
import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";

const UI_ROOT = join(process.cwd());
const REPO_ROOT = join(UI_ROOT, "..");

const HELP_TOPIC_VIEW_RESOLVER_OPERATE = join(
  UI_ROOT,
  "src/lib/help/help-topic-view-resolver-operate.tsx",
);

const PRODUCT_HANDOFF_SURFACES = [
  "archlucid-ui/src/lib/product-documentation-registry-entries-operator-workspace.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-rows-operator-architecture.ts",
  "archlucid-ui/public/doc-index.json",
] as const;

function expectCanonicalHandoff(source: string): void {
  const hasHandoff = ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasHandoff).toBe(true);
}

describe("architecture-draft-editing-help-route (LW-094)", () => {
  it("uses the canonical /help/architecture-draft-editing path", () => {
    expect(ARCHITECTURE_DRAFT_EDITING_HELP_PATH).toBe("/help/architecture-draft-editing");
    expect(ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_PATH).toBe(ARCHITECTURE_DRAFT_EDITING_HELP_PATH);
  });

  it("registers the slug as an app-guided help topic", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("architecture-draft-editing");
  });

  it("routes the slug through HelpArchitectureDraftEditingGuideView", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_OPERATE, "utf8");

    expect(resolverSource).toContain('loaded.entry.slug === "architecture-draft-editing"');
    expect(resolverSource).toContain("HelpArchitectureDraftEditingGuideView");
  });

  it("keeps product handoffs on canonical /help/architecture-draft-editing", () => {
    for (const relativePath of PRODUCT_HANDOFF_SURFACES) {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

      expectCanonicalHandoff(source);
    }
  });
});
