import { describe, expect, it } from "vitest";

import { whyHardCellDisplay } from "@/lib/why-comparison";

describe("whyHardCellDisplay", () => {
  it("uses explicit No for negative cells", () => {
    expect(whyHardCellDisplay("no")).toBe("No");
  });
});
