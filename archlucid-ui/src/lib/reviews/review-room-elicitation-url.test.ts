import { describe, expect, it } from "vitest";

import {
  readRoomElicitationFromSearchParams,
  reviewDetailRoomElicitationHref,
  reviewRoomElicitationHrefFromSearch,
} from "@/lib/reviews/review-room-elicitation-url";

describe("review-room-elicitation-url (DR-16)", () => {
  it("builds href that preserves reviewTab while toggling room elicitation", () => {
    expect(
      reviewRoomElicitationHrefFromSearch(
        "reviewTab=findings&presenterQuestionId=latency",
        true,
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?reviewTab=findings&presenterQuestionId=latency&roomElicitation=1");

    expect(
      reviewRoomElicitationHrefFromSearch(
        "reviewTab=findings&roomElicitation=1",
        false,
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?reviewTab=findings");
  });

  it("reads room elicitation from search params", () => {
    expect(readRoomElicitationFromSearchParams(new URLSearchParams("roomElicitation=1"))).toBe(true);
    expect(readRoomElicitationFromSearchParams(new URLSearchParams("roomElicitation=true"))).toBe(true);
    expect(readRoomElicitationFromSearchParams(new URLSearchParams("reviewTab=overview"))).toBe(false);
  });

  it("builds linked review room elicitation href from architecture draft desk", () => {
    expect(reviewDetailRoomElicitationHref("run-42")).toBe(
      "/architecture/reviews/run-42?roomElicitation=1",
    );
  });

  it("AO-38: nested room handoff uses architecture locator when parent id is known", () => {
    expect(reviewDetailRoomElicitationHref("run-42", "architecture-identity-001")).toBe(
      "/architecture/architectures/architecture-identity-001/reviews/run-42?roomElicitation=1",
    );
    expect(reviewDetailRoomElicitationHref("run-42", "architecture-identity-001")).not.toContain(
      "/architecture/reviews/run-42",
    );
  });
});
