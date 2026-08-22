import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { MANIFEST_DETAIL_TABLIST_ARIA_LABEL } from "@/lib/manifest-detail-section-tabs";

import { ManifestDetailSectionTabs } from "./ManifestDetailSectionTabs";

function renderTabs(): ReturnType<typeof render> {
  return render(
    <ManifestDetailSectionTabs
      decision={<div data-testid="slot-decision">Decision body</div>}
      evidence={<div data-testid="slot-evidence">Evidence body</div>}
      downloads={<div data-testid="slot-downloads">Downloads body</div>}
      diligence={<div id="manifest-ask" data-testid="slot-diligence">Diligence body</div>}
    />,
  );
}

describe("ManifestDetailSectionTabs", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("shows Decision by default and hides the other panels", () => {
    renderTabs();

    expect(screen.getByRole("tablist", { name: MANIFEST_DETAIL_TABLIST_ARIA_LABEL })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Decision" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("slot-decision")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-evidence")).not.toBeInTheDocument();
    expect(screen.queryByTestId("slot-downloads")).not.toBeInTheDocument();
    expect(screen.queryByTestId("slot-diligence")).not.toBeInTheDocument();
  });

  it("switches the visible panel when a tab is selected", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "Evidence" }));

    expect(screen.getByRole("tab", { name: "Evidence" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("slot-evidence")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-decision")).not.toBeInTheDocument();
    expect(window.location.search).toContain("tab=evidence");
    expect(window.location.hash).toBe("");
  });

  it("opens Diligence when the URL hash is a stacked-layout ask anchor", async () => {
    window.history.replaceState({}, "", "/governance/sealed-records/demo-1#manifest-ask");

    renderTabs();

    expect(await screen.findByTestId("slot-diligence")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Diligence" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByTestId("slot-decision")).not.toBeInTheDocument();
  });

  it("honors an explicit initial tab when no hash is present", () => {
    render(
      <ManifestDetailSectionTabs
        initialTab="downloads"
        decision={<div data-testid="slot-decision">Decision body</div>}
        evidence={<div data-testid="slot-evidence">Evidence body</div>}
        downloads={<div data-testid="slot-downloads">Downloads body</div>}
        diligence={<div data-testid="slot-diligence">Diligence body</div>}
      />,
    );

    expect(screen.getByRole("tab", { name: "Downloads" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("slot-downloads")).toBeInTheDocument();
  });
});
