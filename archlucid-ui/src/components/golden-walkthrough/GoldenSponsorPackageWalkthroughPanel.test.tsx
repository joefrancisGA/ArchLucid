import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GoldenSponsorPackageWalkthroughPanel } from "./GoldenSponsorPackageWalkthroughPanel";
import {
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA,
  GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS,
  buildGoldenSponsorPackageWalkthroughHref,
  buildGoldenSponsorPackageWalkthroughStepHref,
} from "@/lib/golden-sponsor-package-walkthrough";

const { useProductLineMock, usePartialCaptureMock, usePartialCaptureSnapshotIdMock } = vi.hoisted(() => ({
  useProductLineMock: vi.fn<() => { productLine: "architecture" | "security" }>(),
  usePartialCaptureMock: vi.fn<(enabled: boolean) => boolean>(),
  usePartialCaptureSnapshotIdMock: vi.fn<(enabled: boolean) => string | null>(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: useProductLineMock,
}));
vi.mock("@/hooks/use-latest-snapshot-capture-partial", () => ({
  useLatestSnapshotCaptureIsPartial: usePartialCaptureMock,
}));
vi.mock("@/hooks/use-latest-partial-capture-snapshot-id", () => ({
  useLatestPartialCaptureSnapshotId: usePartialCaptureSnapshotIdMock,
}));

describe("GoldenSponsorPackageWalkthroughPanel", () => {
  beforeEach(() => {
    useProductLineMock.mockReturnValue({ productLine: "architecture" });
    usePartialCaptureMock.mockReturnValue(false);
    usePartialCaptureSnapshotIdMock.mockReturnValue(null);
  });

  it("renders the checklist and primary CTA to the sponsor export destination", () => {
    render(<GoldenSponsorPackageWalkthroughPanel />);

    expect(screen.getByTestId("golden-sponsor-package-walkthrough")).toBeInTheDocument();
    const checklist = within(screen.getByTestId("golden-sponsor-package-walkthrough-steps"));
    expect(checklist.getAllByRole("listitem")).toHaveLength(
      GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS.length,
    );
    for (const step of GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_STEPS) {
      expect(checklist.getByRole("link", { name: step.label })).toHaveAttribute(
        "href",
        buildGoldenSponsorPackageWalkthroughStepHref(step.id),
      );
    }
    expect(screen.getByText("Illustrative sample")).toBeInTheDocument();

    const primary = screen.getByTestId("golden-sponsor-package-walkthrough-primary");

    expect(primary).toHaveTextContent(GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_PRIMARY_CTA);
    expect(primary).toHaveAttribute("href", buildGoldenSponsorPackageWalkthroughHref());
    expect(primary.className).toContain("border-neutral-300");
    expect(primary.className).not.toContain("bg-[var(--al-primary-action-bg)]");
  });

  it("mounts partial-capture recovery only in SecureNow when switching product lines", () => {
    usePartialCaptureMock.mockReturnValue(true);
    usePartialCaptureSnapshotIdMock.mockReturnValue("partial-snapshot");

    const { rerender } = render(<GoldenSponsorPackageWalkthroughPanel />);

    expect(screen.queryByTestId("golden-sponsor-package-walkthrough-partial-capture")).not.toBeInTheDocument();
    expect(usePartialCaptureMock).not.toHaveBeenCalled();

    useProductLineMock.mockReturnValue({ productLine: "security" });
    rerender(<GoldenSponsorPackageWalkthroughPanel />);

    expect(screen.getByTestId("golden-sponsor-package-walkthrough-partial-capture")).toHaveTextContent("partial-snapshot");
    expect(usePartialCaptureMock).toHaveBeenLastCalledWith(true);
    expect(usePartialCaptureSnapshotIdMock).toHaveBeenLastCalledWith(true);

    useProductLineMock.mockReturnValue({ productLine: "architecture" });
    rerender(<GoldenSponsorPackageWalkthroughPanel />);

    expect(screen.queryByTestId("golden-sponsor-package-walkthrough-partial-capture")).not.toBeInTheDocument();
  });
});
