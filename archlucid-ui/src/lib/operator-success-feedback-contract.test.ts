import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  INLINE_SUCCESS_CALLOUT_SURFACES,
  OPERATOR_SUCCESS_FEEDBACK_RULES,
  TOAST_ON_SUCCESS_SURFACES,
} from "@/lib/operator-success-feedback-contract";

const SRC_ROOT = join(process.cwd(), "src");

function readSurface(relativePath: string): string {
  const absolute = join(SRC_ROOT, relativePath);

  expect(existsSync(absolute), `${relativePath} is registered but missing`).toBe(true);

  return readFileSync(absolute, "utf8");
}

describe("operator success feedback convention (TB-2376)", () => {
  it("documents exactly one rule per channel", () => {
    const channels = OPERATOR_SUCCESS_FEEDBACK_RULES.map((rule) => rule.channel).sort();

    expect(channels).toEqual(["inline-callout", "toast"]);
  });

  it("keeps in-place mutation surfaces off the transient toast helper", () => {
    const offenders = INLINE_SUCCESS_CALLOUT_SURFACES.filter((relativePath) =>
      /\bshowSuccess\b/.test(readSurface(relativePath)),
    );

    expect(offenders).toEqual([]);
  });

  it("keeps navigate-away surfaces out of the inline registry", () => {
    const overlap = TOAST_ON_SUCCESS_SURFACES.filter((relativePath) =>
      INLINE_SUCCESS_CALLOUT_SURFACES.includes(relativePath),
    );

    expect(overlap).toEqual([]);
  });
});
