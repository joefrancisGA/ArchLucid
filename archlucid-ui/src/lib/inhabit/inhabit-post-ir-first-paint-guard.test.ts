import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

describe("inhabit post-IR first-paint guard (IP-011)", () => {
  it("server-prefetches the existing critical-page bundle on nested findings", () => {
    const page = readFileSync(
      join(
        SRC_ROOT,
        "app/(operator)/architecture/architectures/[architectureId]/findings/page.tsx",
      ),
      "utf8",
    );
    const chrome = readFileSync(
      join(SRC_ROOT, "components/governance/InhabitedFindingsDocumentChrome.tsx"),
      "utf8",
    );

    expect(page).toContain("loadInhabitedFindingsInitialTrailBundle");
    expect(page).toContain("inhabitedFindingsInitialTrailBundle");
    expect(chrome).toContain("initialTrailBundle");
    expect(chrome).toContain("initialData:");
  });
});
