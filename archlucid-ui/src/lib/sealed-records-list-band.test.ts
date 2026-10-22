import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF,
  SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL,
} from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";
import {
  SIGNED_RECORDS_LIST_TRAFFIC_SECTION,
  SIGNED_RECORDS_LIST_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-signed-records-list";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SEALED_RECORDS_LIST_BAND_TEST_FILES = [
  "src/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy.test.ts",
  "src/app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient.test.tsx",
  "src/app/(operator)/governance/sealed-records/_sections/enrich-signed-records-list-rows.test.ts",
  "src/lib/ui-route-traffic-signed-records-list.test.ts",
] as const;

describe("sealed records list band regression (TB-1945)", () => {
  it("keeps sibling Vitest guards for TB-1941 through TB-1944 on disk", () => {
    for (const relativePath of SEALED_RECORDS_LIST_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps Browse reviews empty secondary href scope-neutral without projectId=default (TB-1942)", () => {
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_LABEL).toBe("Browse reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).toBe("/architecture/reviews");
    expect(SIGNED_RECORDS_LIST_EMPTY_SECONDARY_HREF).not.toMatch(/projectId=/i);
  });

  it("tracks signed-records list traffic under operator Alerts/gov, not Marketing (TB-1941)", () => {
    expect(SIGNED_RECORDS_LIST_TRAFFIC_ROW_ID).toBe("SI");
    expect(SIGNED_RECORDS_LIST_TRAFFIC_SECTION).toBe("Alerts/gov");
    expect(SIGNED_RECORDS_LIST_TRAFFIC_SECTION).not.toBe("Marketing");
  });

  it("keeps row honesty and pagination enrich covered by list client Vitest (TB-1943, TB-1944)", () => {
    expect(
      existsSync(
        join(UI_ROOT, "src/app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient.test.tsx"),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(UI_ROOT, "src/app/(operator)/governance/sealed-records/_sections/enrich-signed-records-list-rows.test.ts"),
      ),
    ).toBe(true);
  });
});
