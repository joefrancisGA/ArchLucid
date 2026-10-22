import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readIntegrationCatalogMarkdown(): string {
  const repoRoot = path.resolve(process.cwd(), "..");
  const catalogPath = path.join(repoRoot, "docs", "go-to-market", "INTEGRATION_CATALOG.md");

  return readFileSync(catalogPath, "utf8");
}

describe("INTEGRATION_CATALOG buyer copy (TB-602)", () => {
  const markdown = readIntegrationCatalogMarkdown();

  it("distinguishes V1 GA first-party connectors from V1.1 recipe bridges in Build your own", () => {
    const buildYourOwnSection = markdown.split("## 3. Build your own")[1]?.split("## 4.")[0] ?? "";

    expect(buildYourOwnSection).toContain("V1 GA first-party (hosted by ArchLucid)");
    expect(buildYourOwnSection).toContain("V1.1 customer-operated recipe bridge");
    expect(buildYourOwnSection).not.toMatch(/first-party[\s\S]{0,120}are \*\*V1\.1 commitments\*\*/i);
  });

  it("marks promoted ITSM and chat-ops connectors as V1 GA in the roadmap table", () => {
    expect(markdown).toContain("**[V1 GA — first-party]**");
    expect(markdown).toMatch(/\| \*\*ITSM \/ Atlassian\*\* \| Jira[\s\S]*?\*\*\[V1 GA — first-party\]\*\*/);
    expect(markdown).toMatch(/\| \*\*Chat-ops\*\* \| Slack[\s\S]*?\*\*\[V1 GA — first-party\]\*\*/);
  });
});
