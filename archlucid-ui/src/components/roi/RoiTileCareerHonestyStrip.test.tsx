import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RoiTileCareerHonestyStrip } from "@/components/roi/RoiTileCareerHonestyStrip";
import { ROI_TILE_CAREER_BLOCKED_TITLE } from "@/lib/roi/roi-tile-career-honesty";

const honestyPresentationMock = vi.hoisted(() => ({
  value: null as ReturnType<typeof import("@/hooks/use-roi-tile-career-honesty").useRoiTileCareerHonesty>,
}));

vi.mock("@/hooks/use-roi-tile-career-honesty", () => ({
  useRoiTileCareerHonesty: () => honestyPresentationMock.value,
}));

describe("RoiTileCareerHonestyStrip (CG-035)", () => {
  beforeEach(() => {
    honestyPresentationMock.value = null;
  });

  it("renders nothing when honesty does not apply", () => {
    const { container } = render(
      <RoiTileCareerHonestyStrip isSample={false} scopedRunId="run-1" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders blocked rehearsal strip for ROI tiles", () => {
    honestyPresentationMock.value = {
      cellId: "career-simulator-blocked",
      title: ROI_TILE_CAREER_BLOCKED_TITLE,
      body: "Directional savings stay visible for rehearsal.",
      roiSectionQualifier: "Rehearsal ROI",
    };

    render(<RoiTileCareerHonestyStrip isSample={false} scopedRunId="run-1" />);

    expect(screen.getByTestId("roi-tile-career-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("roi-tile-career-honesty-title")).toHaveTextContent(ROI_TILE_CAREER_BLOCKED_TITLE);
  });
});
