import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SLUG } from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";
import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";

const REPO_ROOT = join(process.cwd(), "..");

describe("evidence-source-inspect help stored evidence route (ESI-08)", () => {
  it("registers slug and resolver wiring", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain(EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_SLUG);

    const resolverSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain("HelpInspectStoredEvidenceGuideView");
  });
});
