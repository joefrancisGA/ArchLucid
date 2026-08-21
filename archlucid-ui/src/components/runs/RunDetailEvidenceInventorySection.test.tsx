import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailEvidenceInventorySection } from "@/components/runs/RunDetailEvidenceInventorySection";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";

describe("RunDetailEvidenceInventorySection", () => {
  it("shows upload guidance for in-progress reviews", () => {
    render(<RunDetailEvidenceInventorySection items={[]} hasManifest={false} />);

    expect(screen.getByText(/Upload supporting files or add architecture context/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start a new review" })).not.toBeInTheDocument();
  });

  it("explains sealed records and links to a new review for committed packages", () => {
    render(<RunDetailEvidenceInventorySection items={[]} hasManifest />);

    expect(screen.getByText(/finalized review record is locked/i)).toBeInTheDocument();
    expect(screen.queryByText(/Upload supporting files/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a new review" })).toHaveAttribute("href", REVIEWS_NEW_PATH);
  });

  it("demotes start-new-review CTA when Do this next owns the page primary", () => {
    render(<RunDetailEvidenceInventorySection items={[]} hasManifest pagePrimaryOwnedElsewhere />);

    expect(screen.getByRole("link", { name: "Start a new review" }).className).toContain("border-neutral-300");
  });
});
