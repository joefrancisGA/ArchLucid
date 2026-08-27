import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("SsoWizardPageClient cancel confirm", () => {
  it("does not use window.confirm for unsaved cancel", () => {
    const clientSource = readFileSync(
      path.join(__dirname, "SsoWizardPageClient.tsx"),
      "utf8",
    );
    const chromeSource = readFileSync(
      path.join(__dirname, "SsoWizardPageChrome.tsx"),
      "utf8",
    );
    const combinedSource = `${clientSource}\n${chromeSource}`;

    expect(combinedSource).not.toContain("window.confirm");
    expect(combinedSource).toContain("ConfirmationDialog");
    expect(combinedSource).toContain("pendingCancelConfirm");
  });
});
