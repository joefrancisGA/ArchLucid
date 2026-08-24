import { describe, expect, it } from "vitest";

import { findEffectReadSites } from "@/lib/query/effect-read-scanner";

/**
 * Effects that read from the network and should stay that way. Each entry states why TanStack Query
 * is the wrong owner: a one-shot write, a cache seed, or a call the scanner cannot prove is a read.
 */
const NON_QUERY_SITES: readonly string[] = [
  // Creates the draft and seeds form fields once per intake; both effects are guarded by a ref.
  "src/app/(operator)/architecture/reviews/new/use-guided-intake-draft-workflow.ts",
  // Exchanges the OAuth authorization code exactly once; replaying it on a refetch would fail.
  "src/app/(operator)/auth/callback/CallbackClient.tsx",
  // Completes ITSM OAuth consent exactly once, same single-use code constraint.
  "src/app/(operator)/integrations/itsm/oauth/callback/ItsmAtlassianOAuthCallbackClient.tsx",
  // Starts a demo review — a write, not a read.
  "src/components/cto-demo/CtoDemoLiveRunProgressRail.tsx",
  // Advances the first-run checklist — a write.
  "src/components/operator/OperatorFirstRunWorkflowPanel.tsx",
  // Installs query-cache persistence; the matched call touches storage, not the network.
  "src/components/operator/OperatorQueryProvider.tsx",
];

/**
 * Reads still fetched by hand that belong in TanStack Query. This list may shrink, never grow:
 * migrating a module means deleting its entry here.
 */
const MIGRATION_BACKLOG: readonly string[] = [];

const RECORDED_SITES: readonly string[] = [...NON_QUERY_SITES, ...MIGRATION_BACKLOG];

function sorted(paths: readonly string[]): readonly string[] {
  return [...paths].sort((left, right) => left.localeCompare(right));
}

describe("effect-driven reads", () => {
  const detectedPaths = sorted(findEffectReadSites().map((site) => site.path));

  it("classifies each recorded site exactly once", () => {
    const duplicated = NON_QUERY_SITES.filter((path) => MIGRATION_BACKLOG.includes(path));

    expect(duplicated, "a site cannot be both non-query and awaiting migration").toEqual([]);
    expect(new Set(RECORDED_SITES).size).toBe(RECORDED_SITES.length);
  });

  it("records every module that reads inside an effect", () => {
    const unrecorded = detectedPaths.filter((path) => !RECORDED_SITES.includes(path));

    expect(
      unrecorded,
      "these modules read from the network inside useEffect; move the read to a TanStack Query hook, or add the path to NON_QUERY_SITES with the reason it must stay imperative",
    ).toEqual([]);
  });

  it("lists no module that has stopped reading inside an effect", () => {
    const stale = sorted(RECORDED_SITES).filter((path) => !detectedPaths.includes(path));

    expect(
      stale,
      "these paths no longer read inside useEffect (migrated, renamed, or deleted); delete them from this file",
    ).toEqual([]);
  });
});
