import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowSampleView } from "@/app/(marketing)/securenow-sample/SecureNowSampleView";
import { metadata } from "@/app/(marketing)/securenow-sample/page";
import {
  SECURENOW_SAMPLE_FIXTURE_LINE,
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_DRAFT_PITCH,
} from "@/lib/marketing/securenow-sample-copy";

describe("SecureNow sample page (SN-MKT-09)", () => {
  it("renders the fixture line, pitch, and conversation link", () => {
    render(<SecureNowSampleView />);

    expect(screen.getByTestId("securenow-sample-page")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-sample-fixture-line")).toHaveTextContent(
      SECURENOW_SAMPLE_FIXTURE_LINE,
    );
    expect(screen.getByTestId("securenow-sample-pitch")).toHaveTextContent(WHY_SECURENOW_DRAFT_PITCH);
    expect(screen.getByRole("link", { name: WHY_SECURENOW_CONVERSATION_LABEL })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net?subject=SecureNow%20conversation",
    );
  });

  it("exports indexable metadata", () => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });
});
