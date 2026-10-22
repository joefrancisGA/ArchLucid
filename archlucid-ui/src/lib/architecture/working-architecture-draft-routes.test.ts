import { describe, expect, it } from "vitest";

import {
  architectureIdentityDraftHref,
  architectureNestedDraftPath,
} from "@/lib/architecture/architecture-routes";
import {
  parseArchitectureNestedRoute,
  resolveWorkingPeerDraftRedirectHref,
} from "@/lib/architecture/working-architecture-draft-routes";

describe("working architecture draft routes (AO-05)", () => {
  it("maps identity draft hrefs to nested draft paths", () => {
    expect(architectureIdentityDraftHref("architecture-identity-001", "draft-001")).toBe(
      architectureNestedDraftPath("architecture-identity-001", "draft-001"),
    );
  });

  it("parses nested draft and review routes under an architecture identity", () => {
    expect(parseArchitectureNestedRoute("/architecture/architectures/arch-1/drafts/draft-1")).toEqual({
      architectureId: "arch-1",
      childKind: "drafts",
      childId: "draft-1",
    });
    expect(parseArchitectureNestedRoute("/architecture/architectures/arch-1/reviews/run-1")).toEqual({
      architectureId: "arch-1",
      childKind: "reviews",
      childId: "run-1",
    });
    expect(parseArchitectureNestedRoute("/architecture/architectures/arch-1")).toEqual({
      architectureId: "arch-1",
    });
  });

  it("redirects legacy draft segment paths to nested draft jobs", () => {
    expect(
      resolveWorkingPeerDraftRedirectHref({
        architectureId: "arch-1",
        draftId: "draft-1",
        pathname: "/architecture/architectures/draft-1",
      }),
    ).toBe("/architecture/architectures/arch-1/drafts/draft-1");
  });
});
