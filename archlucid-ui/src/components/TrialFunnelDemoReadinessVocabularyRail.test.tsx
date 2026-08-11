import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrialFunnelDemoReadinessVocabularyRail } from "@/components/TrialFunnelDemoReadinessVocabularyRail";
import {
  TRIAL_FUNNEL_DEMO_READINESS_COMPACT_LINE,
  TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK,
  TRIAL_FUNNEL_DEMO_READINESS_HEADING,
  TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK,
  TRIAL_FUNNEL_DEMO_READINESS_WHY_TWO,
} from "@/lib/trial-funnel-demo-readiness-vocabulary";

describe("TrialFunnelDemoReadinessVocabularyRail (TB-2266)", () => {
  it("renders trial-funnel strip with peer link to demo readiness", () => {
    render(<TrialFunnelDemoReadinessVocabularyRail currentSurfaceId="trial-funnel" />);

    const strip = screen.getByTestId("trial-funnel-demo-readiness-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "trial-funnel");
    expect(strip.textContent ?? "").toContain(TRIAL_FUNNEL_DEMO_READINESS_COMPACT_LINE);

    const peer = screen.getByTestId("trial-funnel-demo-readiness-vocabulary-peer-link");
    expect(peer).toHaveTextContent(TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK.label);
    expect(peer).toHaveAttribute("href", TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK.href);
  });

  it("renders demo-readiness strip with peer link to trial funnel", () => {
    render(<TrialFunnelDemoReadinessVocabularyRail currentSurfaceId="demo-readiness" />);

    expect(screen.getByTestId("trial-funnel-demo-readiness-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "demo-readiness",
    );

    const peer = screen.getByTestId("trial-funnel-demo-readiness-vocabulary-peer-link");
    expect(peer).toHaveTextContent(TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK.label);
    expect(peer).toHaveAttribute("href", TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <TrialFunnelDemoReadinessVocabularyRail currentSurfaceId="trial-funnel" variant="full" />,
    );

    const strip = screen.getByTestId("trial-funnel-demo-readiness-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(TRIAL_FUNNEL_DEMO_READINESS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(TRIAL_FUNNEL_DEMO_READINESS_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("trial-funnel-demo-readiness-vocabulary-current")).toHaveTextContent(
      TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK.label,
    );
  });
});
