import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round153 wave H5 mounted contract", () => {
  it("pipes marketability buyer path on reviewer home, quote packet, and pilot decision", () => {
    expect(readUiSource("components/product-line/SecureNowReviewerHomeSection.tsx")).toContain(
      "securenow-reviewer-home-marketability-buyer-path",
    );
    expect(readUiSource("app/(operator)/administration/securenow-quote-packet/SecureNowQuotePacketPageView.tsx")).toContain(
      "securenow-quote-packet-marketability-buyer-path",
    );
    expect(readUiSource("app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx")).toContain(
      "securenow-pilot-decision-marketability-buyer-path",
    );
  });
});
