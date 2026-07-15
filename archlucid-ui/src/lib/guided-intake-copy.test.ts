import { describe, expect, it } from "vitest";

import { GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER } from "@/lib/guided-intake-copy";

describe("guided-intake-copy (TB-773)", () => {
  it("uses cloud-neutral creation overview placeholder", () => {
    expect(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER).toMatch(/private networking/i);
    expect(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER).not.toMatch(/\bAzure\b/i);
    expect(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_PLACEHOLDER).not.toMatch(/Entra/i);
  });
});
