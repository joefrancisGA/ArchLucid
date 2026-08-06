import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConnectionStatusEvidenceOrientationStrip } from "@/app/(operator)/administration/connection-status/_sections/ConnectionStatusEvidenceOrientationStrip";
import {
  CONNECTION_STATUS_CANONICAL_PATH,
  CONNECTION_STATUS_SOURCES,
} from "@/lib/connection-status-evidence-copy";

describe("ConnectionStatusEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking connection status", () => {
    render(<ConnectionStatusEvidenceOrientationStrip />);

    expect(screen.getByTestId("connection-status-sources")).toBeInTheDocument();
    expect(screen.getByTestId("connection-status-claim-discipline")).toBeInTheDocument();

    for (const link of CONNECTION_STATUS_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      CONNECTION_STATUS_SOURCES.some((link) => link.href === CONNECTION_STATUS_CANONICAL_PATH),
    ).toBe(false);
  });
});
