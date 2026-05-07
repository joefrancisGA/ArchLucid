import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_TOPICS } from "@/lib/help-topics";
import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";

/** Vitest runs with cwd = `archlucid-ui` (`npm test` in package). */
const repoRoot = path.resolve(process.cwd(), "..");

describe("cognitive-load docs drift guard", () => {
  it("HELP_TOPICS doc paths resolve to files under the repo root", () => {
    for (const topic of HELP_TOPICS) {
      const relative = topic.docPath.replace(/^\/+/, "");
      const abs = path.join(repoRoot, ...relative.split("/"));

      expect(existsSync(abs), `missing doc for help topic ${topic.id}: ${topic.docPath}`).toBe(true);
    }
  });

  it("legacy onboarding redirects target /onboarding and preserve query params", () => {
    expect(buildOnboardingRedirectPath({})).toBe("/onboarding");

    const withParams = buildOnboardingRedirectPath({ tenant: "acme", tag: ["a", "b"] });
    expect(withParams.startsWith("/onboarding?")).toBe(true);

    const u = new URL(withParams, "http://localhost");
    expect(u.pathname).toBe("/onboarding");
    expect(u.searchParams.getAll("tenant")).toEqual(["acme"]);
    expect(u.searchParams.getAll("tag")).toEqual(["a", "b"]);
  });
});
