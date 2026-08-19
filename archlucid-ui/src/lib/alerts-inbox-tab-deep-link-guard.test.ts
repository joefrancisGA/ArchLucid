import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ALERTS_INBOX_TAB_DEEP_LINK_GUARD_ALLOWLIST,
  findAlertsInboxTabDeepLinkViolations,
  RETIRED_GOVERNANCE_ALERTS_INBOX_TAB_HREF,
} from "@/lib/alerts-inbox-tab-deep-link-guard";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import {
  CANONICAL_ALERTS_INBOX_TRAFFIC_PATH,
  RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-alerts-inbox-tab";

const SRC_ROOT = join(process.cwd(), "src");

const ALLOWLIST = new Set(ALERTS_INBOX_TAB_DEEP_LINK_GUARD_ALLOWLIST);

const REMEDIATION =
  `Use ${GOVERNANCE_ALERTS_PATH} (or buildCanonicalGovernanceAlertsInboxHref) instead of `
  + `${RETIRED_GOVERNANCE_ALERTS_INBOX_TAB_HREF}.`;

function collectSourceFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectSourceFiles(absolute));
      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    collected.push(absolute);
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

describe("alerts inbox tab deep-link guard (TB-1596)", () => {
  it("keeps canonical and retired traffic paths explicit", () => {
    expect(CANONICAL_ALERTS_INBOX_TRAFFIC_PATH).toBe(GOVERNANCE_ALERTS_PATH);
    expect(RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH).toBe(RETIRED_GOVERNANCE_ALERTS_INBOX_TAB_HREF);
  });

  it("does not emit retired tab=inbox deep links outside the allowlist", () => {
    const offenders = collectSourceFiles(SRC_ROOT)
      .map((absolute) => toPosixRelativePath(absolute))
      .filter((path) => !ALLOWLIST.has(path))
      .map((path) => ({
        path,
        violations: findAlertsInboxTabDeepLinkViolations(readFileSync(join(SRC_ROOT, path), "utf8")),
      }))
      .filter((result) => result.violations.length > 0)
      .map((result) => `${result.path}: ${result.violations.join(", ")}`);

    expect(offenders, REMEDIATION).toEqual([]);
  });
});
