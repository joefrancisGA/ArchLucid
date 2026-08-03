import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SystemHealthSourcesStrip } from "@/app/(operator)/administration/system-health/_sections/SystemHealthSourcesStrip";
import { SYSTEM_HEALTH_CANONICAL_PATH, SYSTEM_HEALTH_SOURCES } from "@/lib/system-health-evidence-copy";

describe("SystemHealthSourcesStrip", () => {
  it("lists follow-up Sources without self-linking system-health", () => {
    render(<SystemHealthSourcesStrip />);

    expect(screen.getByTestId("system-health-sources")).toBeInTheDocument();
    expect(screen.getByTestId("system-health-claim-discipline")).toHaveTextContent(/diligence Sources trail/i);

    const sources = screen.getByTestId("system-health-sources");

    for (const link of SYSTEM_HEALTH_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SYSTEM_HEALTH_SOURCES.some((link) => link.href === SYSTEM_HEALTH_CANONICAL_PATH)).toBe(false);
  });
});
