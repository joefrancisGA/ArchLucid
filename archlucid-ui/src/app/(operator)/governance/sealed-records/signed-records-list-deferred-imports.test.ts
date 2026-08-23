import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readDeferredChunkImportLoaderSource } from "@/lib/operator/deferred-chunk-import-loader-source.test-helper";

const routeDir = dirname(fileURLToPath(import.meta.url));
const sectionsDir = join(routeDir, "_sections");

const pageSource = readFileSync(join(routeDir, "page.tsx"), "utf8");
const clientSource = readFileSync(join(sectionsDir, "SignedRecordsListClient.tsx"), "utf8");
const deferredSource = readFileSync(join(sectionsDir, "signed-records-list-deferred-chunks.tsx"), "utf8");
const manifestLoaderSource = readDeferredChunkImportLoaderSource();

const bannedClientImports = ['./SignedRecordsListTable"'] as const;

describe("signed-records list deferred imports (TB-2061 / wave 11)", () => {
  it("keeps SignedRecordsListClient off the page static import graph", () => {
    expect(pageSource).not.toContain('import SignedRecordsListClient from "./_sections/SignedRecordsListClient"');
    expect(pageSource).toContain("SignedRecordsListClientDeferred");
    expect(pageSource).not.toContain("next/dynamic");
  });

  it("keeps the EnterpriseTable cluster off SignedRecordsListClient static import graph", () => {
    for (const bannedImport of bannedClientImports) {
      expect(clientSource).not.toContain(bannedImport);
    }

    expect(clientSource).toContain("signed-records-list-deferred-chunks");
    expect(clientSource).toContain("SignedRecordsListTableDeferred");
  });

  it("dynamic-imports the signed-records list table via manifest loaders", () => {
    expect(deferredSource).toContain("createDeferredComponentFromManifest");
    expect(deferredSource).not.toContain("next/dynamic");
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/governance/sealed-records/_sections/SignedRecordsListTable")',
    );
    expect(manifestLoaderSource).toContain(
      'import("@/app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient")',
    );
    expect(deferredSource).toContain("signed-records-list-table");
    expect(deferredSource).toContain("signed-records-list-client");
  });
});
