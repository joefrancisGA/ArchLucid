import { describe, expect, it } from "vitest";

import { GET_STARTED_HELP_GETTING_STARTED_HREF } from "@/app/(marketing)/get-started/get-started-content";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  GET_STARTED_ORIENTATION_SOURCES,
  GET_STARTED_SOURCES,
} from "@/lib/get-started-evidence-copy";

describe("get-started-evidence-copy", () => {
  it("excludes signup and getting-started help from orientation Sources when the page surfaces those CTAs", () => {
    expect(GET_STARTED_SOURCES.some((source) => source.href === "/signup")).toBe(true);
    expect(GET_STARTED_SOURCES.some((source) => source.href === inAppHelpHref("getting-started"))).toBe(true);
    expect(GET_STARTED_ORIENTATION_SOURCES.some((source) => source.href === "/signup")).toBe(false);
    expect(
      GET_STARTED_ORIENTATION_SOURCES.some((source) => source.href === GET_STARTED_HELP_GETTING_STARTED_HREF),
    ).toBe(false);
    expect(
      GET_STARTED_ORIENTATION_SOURCES.some((source) => source.href === inAppHelpHref("getting-started")),
    ).toBe(false);
  });
});
