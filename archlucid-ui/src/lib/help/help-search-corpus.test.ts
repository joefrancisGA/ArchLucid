import { describe, expect, it } from "vitest";

import { isRunbookHelpDocPath, resolveHelpSearchCorpus } from "@/lib/help/help-search-corpus";

describe("help-search-corpus (TB-2237)", () => {
  it("defaults to customer corpus unless developer docs are requested", () => {
    expect(resolveHelpSearchCorpus()).toBe("customer");
    expect(resolveHelpSearchCorpus({ includeDeveloperDocs: true })).toBe("internal");
  });

  it("classifies runbook doc paths", () => {
    expect(isRunbookHelpDocPath("docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md")).toBe(true);
    expect(isRunbookHelpDocPath("in-app:/help/troubleshooting")).toBe(false);
  });
});
