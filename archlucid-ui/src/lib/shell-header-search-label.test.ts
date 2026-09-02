import { describe, expect, it } from "vitest";

import {
  resolveShellHeaderSearchLabel,
  resolveShellHeaderSearchPlaceholder,
} from "@/lib/shell-header-search-label";

describe("shell header search copy", () => {
  it("uses route-aware labels on governance and review surfaces", () => {
    expect(resolveShellHeaderSearchLabel("/governance/findings")).toBe("Search findings");
    expect(resolveShellHeaderSearchLabel("/architecture/reviews/run-abc")).toBe("Search this review");
    expect(resolveShellHeaderSearchLabel("/")).toBe("Search reviews");
  });

  it("uses route-aware placeholders in buyer-polished shell", () => {
    expect(resolveShellHeaderSearchPlaceholder("/governance/findings")).toContain("findings");
    expect(resolveShellHeaderSearchPlaceholder("/architecture/reviews/run-abc")).toContain("sponsor");
  });
});
