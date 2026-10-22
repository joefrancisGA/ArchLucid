import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftNextDraftFooter } from "./ArchitectureDraftNextDraftFooter";

describe("ArchitectureDraftNextDraftFooter", () => {
  it("renders next draft link", () => {
    render(
      <ArchitectureDraftNextDraftFooter
        target={{
          architectureId: "draft-2",
          displayName: "Payments core",
          href: "/architecture/architectures/draft-2",
        }}
      />,
    );

    expect(screen.getByTestId("architecture-draft-next-draft-footer")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-next-draft-action")).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-2",
    );
  });
});
