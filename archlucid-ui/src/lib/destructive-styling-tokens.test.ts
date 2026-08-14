import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Files still carrying raw destructive red utilities (TB-2375 ratchet baseline).
 *
 * This list may shrink but must never grow: new destructive affordances must use
 * `Button variant="destructive"`, `AlertDialogAction`, or `OPERATOR_DANGER` so light and dark
 * mode stay in step. Delete entries as they are migrated.
 */
const RAW_DANGER_UTILITY_BASELINE: ReadonlySet<string> = new Set([
  "app/(operator)/administration/auth-domains/AuthDomainsPageClient.tsx",
  "app/(operator)/insights/executive-summary/_sections/PilotValueReportSeverityBars.tsx",
  "app/global-error.tsx",
  "components/ApiValidationFieldErrorList.tsx",
  "components/BulkEvidenceUpload.tsx",
  "components/BuyerCtoDemoTourOverlay.tsx",
  "components/TrialBanner.tsx",
  "components/compare/ArchitectureManifestUnifiedDiffView.tsx",
  "components/operator-home/SystemHealthStatusStrip.tsx",
  "components/review-intake/ReviewStartInlineError.tsx",
  "components/shell/ShellInFlightOperationsAffordance.tsx",
]);

const RAW_DANGER_BACKGROUND = /\bbg-red-\d/;

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

describe("destructive styling tokens (TB-2375)", () => {
  it("keeps raw bg-red-* utilities inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter((absolute) => RAW_DANGER_BACKGROUND.test(readFileSync(absolute, "utf8")))
      .map(toPosixRelativePath)
      .filter((path) => !RAW_DANGER_UTILITY_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("routes shared destructive primitives through OPERATOR_DANGER", () => {
    const buttonSource = readFileSync(join(SRC_ROOT, "components/ui/button.tsx"), "utf8");
    const alertDialogSource = readFileSync(join(SRC_ROOT, "components/ui/alert-dialog.tsx"), "utf8");
    const badgeSource = readFileSync(join(SRC_ROOT, "components/ui/badge.tsx"), "utf8");

    for (const source of [buttonSource, alertDialogSource, badgeSource]) {
      expect(source).toContain("OPERATOR_DANGER.action");
      expect(source).not.toMatch(RAW_DANGER_BACKGROUND);
    }
  });
});
