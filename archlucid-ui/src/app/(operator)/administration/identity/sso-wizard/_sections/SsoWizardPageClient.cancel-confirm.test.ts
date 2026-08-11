import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("SsoWizardPageClient cancel confirm", () => {
  it("does not use window.confirm for unsaved cancel", () => {
    const source = readFileSync(
      path.join(__dirname, "SsoWizardPageClient.tsx"),
      "utf8",
    );

    expect(source).not.toContain("window.confirm");
    expect(source).toContain("ConfirmationDialog");
    expect(source).toContain("pendingCancelConfirm");
  });
});
