import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";

describe("PageShortcutsDisclosure", () => {
  it("lists page-scoped shortcut entries in a disclosure", () => {
    render(
      <PageShortcutsDisclosure
        testId="graph-page-shortcuts"
        entries={[
          { id: "zoom", label: "Scroll", description: "Zoom the canvas." },
        ]}
      />,
    );

    expect(screen.getByTestId("graph-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("graph-page-shortcuts-entry-zoom")).toHaveTextContent("Scroll");
  });
});
