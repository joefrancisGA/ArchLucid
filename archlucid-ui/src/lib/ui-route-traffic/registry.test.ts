import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  loadUiRouteTrafficMasterTableRows,
  UI_ROUTE_TRAFFIC_ESTIMATES_TEMPLATE_PATH,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import {
  findUiRouteTrafficRow,
  UI_ROUTE_TRAFFIC_ROWS,
  UI_ROUTE_TRAFFIC_STANDALONE_MODULES,
} from "@/lib/ui-route-traffic/registry";

const templateRows = loadUiRouteTrafficMasterTableRows();

describe("ui route traffic registry", () => {
  it("holds at least one row", () => {
    expect(UI_ROUTE_TRAFFIC_ROWS.length).toBeGreaterThan(0);
  });

  it("declares each workbook row id only once", () => {
    const rowIds = UI_ROUTE_TRAFFIC_ROWS.map((row) => row.rowId);

    expect(new Set(rowIds).size).toBe(rowIds.length);
  });

  it("declares each tracked path only once", () => {
    const paths = UI_ROUTE_TRAFFIC_ROWS.map((row) => row.path);
    const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);

    expect(duplicates).toEqual([]);
  });

  it("finds a registered row by id and misses an unknown one", () => {
    const first = UI_ROUTE_TRAFFIC_ROWS[0];

    expect(findUiRouteTrafficRow(first.rowId)).toBe(first);
    expect(findUiRouteTrafficRow("no-such-row-id")).toBeUndefined();
  });
});

describe(`ui route traffic registry vs ${UI_ROUTE_TRAFFIC_ESTIMATES_TEMPLATE_PATH}`, () => {
  for (const row of UI_ROUTE_TRAFFIC_ROWS) {
    describe(`${row.rowId} (${row.path})`, () => {
      const templateRow = templateRows.find((candidate) => candidate.id === row.rowId);

      it("has a master table row", () => {
        expect(templateRow).toBeDefined();
      });

      it("tracks the canonical path and section", () => {
        expect(templateRow?.path).toBe(row.path);
        expect(templateRow?.section).toBe(row.section);
      });

      it("matches the workbook notes verbatim", () => {
        expect(templateRow?.notes).toBe(row.note);
      });

      if (row.noteMustContain !== undefined) {
        it("keeps the phrases the row documents", () => {
          for (const phrase of row.noteMustContain ?? []) {
            expect(templateRow?.notes, phrase).toContain(phrase);
          }
        });
      }

      if (row.noteMustNotContain !== undefined) {
        it("stays clear of retired phrasing", () => {
          for (const phrase of row.noteMustNotContain ?? []) {
            expect(templateRow?.notes, phrase).not.toContain(phrase);
          }
        });
      }

      if (row.noteMustNotContainLower !== undefined) {
        it("stays clear of retired phrasing in any casing", () => {
          for (const phrase of row.noteMustNotContainLower ?? []) {
            expect(templateRow?.notes.toLowerCase(), phrase).not.toContain(phrase);
          }
        });
      }

      if (row.noteMustMatch !== undefined) {
        it("keeps its evidence-chrome claim", () => {
          for (const pattern of row.noteMustMatch ?? []) {
            expect(templateRow?.notes, String(pattern)).toMatch(pattern);
          }
        });
      }

      if (row.sectionMustNotEqual !== undefined) {
        it("does not regress to another section", () => {
          for (const section of row.sectionMustNotEqual ?? []) {
            expect(templateRow?.section, section).not.toBe(section);
          }
        });
      }

      if (row.sectionMustNotEqualLower !== undefined) {
        it("does not regress to another section in any casing", () => {
          for (const section of row.sectionMustNotEqualLower ?? []) {
            expect(templateRow?.section.toLowerCase(), section).not.toBe(section);
          }
        });
      }
    });
  }
});

describe("ui route traffic standalone modules", () => {
  const libDir = join(process.cwd(), "src", "lib");

  const actualModules = readdirSync(libDir)
    .filter(
      (name) =>
        name.startsWith("ui-route-traffic-") && name.endsWith(".ts") && !name.endsWith(".test.ts"),
    )
    .map((name) => name.replace(/\.ts$/, ""))
    .sort();

  it("matches the allowlist exactly, so new routes are added to the registry instead", () => {
    expect(actualModules).toEqual([...UI_ROUTE_TRAFFIC_STANDALONE_MODULES].sort());
  });

  it("never lets a standalone module shadow a registry row id", () => {
    const registryRowIds = new Set(UI_ROUTE_TRAFFIC_ROWS.map((row) => row.rowId));
    const overlapping = UI_ROUTE_TRAFFIC_STANDALONE_MODULES.filter((moduleName) =>
      registryRowIds.has(moduleName),
    );

    expect(overlapping).toEqual([]);
  });
});
