import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  findOperatorUrlQueryWriterViolations,
  isOperatorHrefFromSearchWriterSourceCompliant,
} from "@/lib/operator/operator-url-query-writer-guard";

const UI_ROOT = join(process.cwd());

describe("operator URL query writer guard", () => {
  it(
    "requires selection-switch routing for every HrefFromSearch exporter",
    () => {
      expect(findOperatorUrlQueryWriterViolations(UI_ROOT)).toEqual([]);
    },
    120_000,
  );

  it("flags HrefFromSearch exporters that skip selection-switch routing", () => {
    const nonCompliant = `export function demoStaleHrefFromSearch(currentSearch: string, pathname: string): string {
  const params = new URLSearchParams(currentSearch);
  params.set("q", "1");
  return pathname;
}`;

    expect(isOperatorHrefFromSearchWriterSourceCompliant(nonCompliant)).toBe(false);
    expect(
      isOperatorHrefFromSearchWriterSourceCompliant(
        `${nonCompliant}\napplyOperatorUrlSelectionSwitch(params, { kind: "disclosure-only" });`,
      ),
    ).toBe(true);
  });
});
