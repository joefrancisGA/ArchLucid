import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PackageChangesSinceFinalizePanel } from "./PackageChangesSinceFinalizePanel";
import type { PackageChangeSourceEvent } from "@/lib/package-changes-since-finalize";

const events: PackageChangeSourceEvent[] = [
  {
    eventId: "e-finalize",
    eventType: "ManifestFinalized",
    occurredUtc: "2026-08-01T12:00:00Z",
  },
  {
    eventId: "e-export",
    eventType: "artifact.bundle.created",
    occurredUtc: "2026-08-01T14:00:00Z",
  },
];

describe("PackageChangesSinceFinalizePanel", () => {
  it("renders timeline entries after finalize", () => {
    render(<PackageChangesSinceFinalizePanel events={events} finalizeUtc="2026-08-01T12:00:00Z" />);

    expect(screen.getByTestId("package-changes-since-finalize")).toBeInTheDocument();
    expect(screen.getByTestId("package-changes-since-finalize-list")).toBeInTheDocument();
    expect(screen.getByTestId("package-changes-since-finalize-entry")).toHaveAttribute(
      "data-change-kind",
      "export",
    );
  });

  it("shows honest empty copy when nothing moved after finalize", () => {
    render(
      <PackageChangesSinceFinalizePanel
        events={[{ eventId: "e-finalize", eventType: "ManifestFinalized", occurredUtc: "2026-08-01T12:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("package-changes-since-finalize-empty")).toHaveTextContent(
      "No recorded changes since finalize yet.",
    );
  });
});
