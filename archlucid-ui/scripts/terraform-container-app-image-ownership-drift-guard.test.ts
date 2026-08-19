import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");
const CONTAINER_APPS_ROOT = join(REPO_ROOT, "infra", "terraform-container-apps");

const CONTAINER_APP_RESOURCES = [
  'resource "azurerm_container_app" "api"',
  'resource "azurerm_container_app" "worker"',
  'resource "azurerm_container_app" "ui"',
  'resource "azurerm_container_app" "api_secondary"',
  'resource "azurerm_container_app" "worker_secondary"',
  'resource "azurerm_container_app" "ui_secondary"',
] as const;

const IMAGE_LIFECYCLE_PATTERN =
  /lifecycle\s*\{[\s\S]*?ignore_changes\s*=\s*\[[\s\S]*?template\[0\]\.container\[0\]\.image[\s\S]*?\]/;

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

function containerAppBlock(source: string, resourceHeader: string): string {
  const start = source.indexOf(resourceHeader);

  if (start < 0) {
    return "";
  }

  const nextResource = source.indexOf('resource "', start + resourceHeader.length);
  const end = nextResource < 0 ? source.length : nextResource;

  return source.slice(start, end);
}

describe("terraform container app image ownership drift guard (TB-657)", () => {
  const mainTf = readFileSync(join(CONTAINER_APPS_ROOT, "main.tf"), "utf8");
  const secondaryTf = readFileSync(join(CONTAINER_APPS_ROOT, "secondary_region.tf"), "utf8");
  const combinedTf = `${mainTf}\n${secondaryTf}`;

  it("documents CD-owned runtime image tags", () => {
    const ownershipDoc = readFileSync(join(CONTAINER_APPS_ROOT, "container_app_image_ownership.tf"), "utf8");

    expect(ownershipDoc).toContain("TB-657");
    expect(ownershipDoc).toContain("az containerapp update");
  });

  it("ignores container image on every azurerm_container_app workload", () => {
    for (const resourceHeader of CONTAINER_APP_RESOURCES) {
      const block = containerAppBlock(combinedTf, resourceHeader);

      expect(block.length, resourceHeader).toBeGreaterThan(0);
      expect(block, resourceHeader).toMatch(IMAGE_LIFECYCLE_PATTERN);
    }
  });

  it("documents CD ownership in DEPLOYMENT_CD_PIPELINE.md", () => {
    const pipelineDoc = readRepoFile("docs/library/DEPLOYMENT_CD_PIPELINE.md");

    expect(pipelineDoc).toContain("TB-657");
    expect(pipelineDoc).toContain("ignore_changes");
    expect(pipelineDoc).toContain("CD owns runtime Container App image tags");
  });
});
