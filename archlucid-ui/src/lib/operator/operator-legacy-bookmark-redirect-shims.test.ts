import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const OPERATOR_APP_ROOT = join(process.cwd(), "src", "app", "(operator)");

/** Retired bookmark paths — IA batch 4 removed App Router redirect shims; direct hits 404. */
const RETIRED_BOOKMARK_REDIRECT_SHIM_PAGES = [
  join(OPERATOR_APP_ROOT, "internal", "replay", "page.tsx"),
  join(OPERATOR_APP_ROOT, "internal", "integration-events", "dlq", "page.tsx"),
  join(OPERATOR_APP_ROOT, "internal", "cli-usage", "page.tsx"),
  join(OPERATOR_APP_ROOT, "operate", "architecture-graph", "page.tsx"),
  join(OPERATOR_APP_ROOT, "administration", "tenant", "page.tsx"),
  join(OPERATOR_APP_ROOT, "administration", "tenant", "recycle-bin", "page.tsx"),
] as const;

describe("operator legacy bookmark redirect shims (IA batch 4)", () => {
  it.each(RETIRED_BOOKMARK_REDIRECT_SHIM_PAGES)("does not ship App Router redirect page at %s", (pagePath) => {
    expect(existsSync(pagePath)).toBe(false);
  });
});
