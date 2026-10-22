import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DESK_IA_HELP_SEALED_VS_REGISTER_PATH,
} from "@/lib/desk-ia-help-sealed-vs-decision-register-route";
import {
  DESK_IA_HELP_SEALED_VS_REGISTER_SLUG,
  DESK_IA_HELP_SEALED_VS_REGISTER_TITLE,
} from "@/lib/desk-ia-sealed-vs-decision-register-help-guide-content";
import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";

const REPO_ROOT = join(process.cwd(), "..");

describe("desk-ia help sealed vs decision register (DI-023)", () => {
  it("registers slug, path, and guided topic", () => {
    expect(DESK_IA_HELP_SEALED_VS_REGISTER_PATH).toBe(
      `/help/${DESK_IA_HELP_SEALED_VS_REGISTER_SLUG}`,
    );
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain(DESK_IA_HELP_SEALED_VS_REGISTER_SLUG);
    expect(DESK_IA_HELP_SEALED_VS_REGISTER_TITLE).toMatch(/decision register/i);
  });

  it("resolver wires HelpSealedVsDecisionRegisterGuideView", () => {
    const resolverSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain('loaded.entry.slug === "sealed-record-vs-decision-register"');
    expect(resolverSource).toContain("HelpSealedVsDecisionRegisterGuideView");
  });
});
