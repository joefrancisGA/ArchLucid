import { describe, expect, it } from "vitest";

import {
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL,
  buildActorDependentQuietEnginesArchitectureHref,
  buildActorDependentQuietEnginesDraftHref,
} from "./actor-dependent-findings-quiet-engines-recovery";

describe("actor-dependent-findings-quiet-engines-recovery", () => {
  it("builds architecture tab deep links for the open review", () => {
    expect(buildActorDependentQuietEnginesArchitectureHref("run-abc")).toBe(
      "/architecture/reviews/run-abc?reviewTab=architecture",
    );
    expect(ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_ARCHITECTURE_LINK_LABEL).toMatch(/Architecture/i);
  });

  it("builds draft actor editor links", () => {
    expect(buildActorDependentQuietEnginesDraftHref("draft-1")).toBe("/architecture/architectures/draft-1");
  });
});
