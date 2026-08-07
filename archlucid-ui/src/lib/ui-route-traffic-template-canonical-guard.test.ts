import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

const REDIRECT_ONLY_PATHS = [
  "/alerts",
  "/audit",
  "/settings/cloud-connections",
  "/settings/roles",
  "/admin/users",
  "/admin/support",
  "/workspace/security-trust",
  "/help/cloud-connections-azure",
  "/help/cloud-connections-aws",
  "/help/cloud-connections-gcp",
  "/admin/cloud-connections/aws",
  "/settings/cost-reporting",
  "/health",
];

function readTemplateMarkdown(): string {
  return readFileSync(join(process.cwd(), "..", TEMPLATE_PATH), "utf8");
}

function extractMasterTablePaths(markdown: string): string[] {
  const marker = "## Master table";
  const start = markdown.indexOf(marker);
  if (start < 0) {
    throw new Error(`Missing master table in ${TEMPLATE_PATH}`);
  }

  const tableSection = markdown.slice(start);
  const paths: string[] = [];
  for (const line of tableSection.split("\n")) {
    const match = line.match(/^\| [^|]+ \| `([^`]+)` \|/);
    if (match !== null) {
      paths.push(match[1]);
    }
  }

  return paths;
}

describe("ui-route-traffic-template-canonical-guard (TB-748)", () => {
  it("tracks canonical nav paths, not redirect-only legacy aliases", () => {
    const markdown = readTemplateMarkdown();
    const paths = extractMasterTablePaths(markdown);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain("/governance/alerts");
    expect(paths).toContain("/integrations/cloud-connections");
    expect(paths).toContain("/governance/signed-records/[manifestId]/artifacts/[artifactId]");

    for (const legacyPath of REDIRECT_ONLY_PATHS) {
      expect(paths).not.toContain(legacyPath);
    }
  });
});
