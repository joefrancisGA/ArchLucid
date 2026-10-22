import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";
import { pathIsWorkingInhabitedFindingsRoute } from "@/lib/inhabit/inhabit-help-route";
import { INHABIT_THE_ARCHITECTURE_HELP_SLUG } from "@/lib/inhabit/inhabit-help-guide-content";

describe("inhabit help route (IH-014)", () => {
  it("maps nested architecture findings to inhabit-the-architecture help", () => {
    const path = architectureNestedFindingsPath("architecture-identity-001");

    expect(pathIsWorkingInhabitedFindingsRoute(path)).toBe(true);
    expect(pageHelpTopicForPathname(path)?.slug).toBe(INHABIT_THE_ARCHITECTURE_HELP_SLUG);
  });

  it("registers guided help view resolver for inhabit-the-architecture", () => {
    const resolverSource = readFileSync(
      join(process.cwd(), "src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain('loaded.entry.slug === "inhabit-the-architecture"');
    expect(resolverSource).toContain("HelpInhabitTheArchitectureGuideView");
  });
});
