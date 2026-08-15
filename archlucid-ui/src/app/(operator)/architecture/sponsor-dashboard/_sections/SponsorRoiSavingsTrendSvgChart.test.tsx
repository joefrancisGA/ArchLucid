import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorRoiSavingsTrendSvgChart } from "./SponsorRoiSavingsTrendSvgChart";

describe("SponsorRoiSavingsTrendSvgChart", () => {
  it("matches snapshot for six monthly savings points", () => {
    const points = [
      { snapshotUtc: "2026-01-15T00:00:00Z", totalEstimatedUsdSavings: 2000 },
      { snapshotUtc: "2026-02-15T00:00:00Z", totalEstimatedUsdSavings: 4500 },
      { snapshotUtc: "2026-03-15T00:00:00Z", totalEstimatedUsdSavings: 3000 },
      { snapshotUtc: "2026-04-15T00:00:00Z", totalEstimatedUsdSavings: 8240 },
      { snapshotUtc: "2026-05-15T00:00:00Z", totalEstimatedUsdSavings: 6100 },
      { snapshotUtc: "2026-06-15T00:00:00Z", totalEstimatedUsdSavings: 7200 },
    ];

    const { container } = render(<SponsorRoiSavingsTrendSvgChart points={points} />);

    expect(container.querySelector('[data-testid="exec-roi-trend-svg-chart"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="exec-roi-trend-svg-bar"]')).toHaveLength(6);
    expect(container.firstChild).toMatchSnapshot();
  });
});
