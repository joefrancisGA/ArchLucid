import { describe, expect, it } from "vitest";

import { formatWorkspacePrimaryConcernDisplay } from "./primary-concern-display";

describe("formatWorkspacePrimaryConcernDisplay (P-11)", () => {
  it("labels derived primary concern as severity-first", () => {
    expect(formatWorkspacePrimaryConcernDisplay("Error: PHI risk", true)).toContain(
      "first unresolved finding by severity",
    );
  });

  it("uses not-stored copy when snapshot is missing", () => {
    expect(formatWorkspacePrimaryConcernDisplay(null, false)).toBe("Primary concern was not stored.");
  });
});
