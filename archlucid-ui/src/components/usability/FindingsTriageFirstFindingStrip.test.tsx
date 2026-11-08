import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingsTriageFirstFindingStrip } from "./FindingsTriageFirstFindingStrip";

vi.mock("@/lib/workspace-mode/use-teaching-chrome-visible", () => ({
  useTeachingChromeVisible: () => true,
}));

describe("FindingsTriageFirstFindingStrip", () => {
  it("links to the first finding in the queue", () => {
    render(
      <FindingsTriageFirstFindingStrip
        findingId="finding-1"
        findingTitle="PHI boundary gap"
        href="/governance/findings?findingId=finding-1"
      />,
    );

    expect(screen.getByTestId("findings-triage-first-finding-strip")).toBeInTheDocument();
    expect(screen.getByTestId("findings-triage-first-finding-action")).toHaveAttribute(
      "href",
      "/governance/findings?findingId=finding-1",
    );
  });
});
