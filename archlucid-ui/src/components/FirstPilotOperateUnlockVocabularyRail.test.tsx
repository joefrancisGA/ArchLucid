import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstPilotOperateUnlockVocabularyRail } from "@/components/FirstPilotOperateUnlockVocabularyRail";
import {
  FIRST_PILOT_OPERATE_UNLOCK_COMPACT_LINE,
  FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK,
  FIRST_PILOT_OPERATE_UNLOCK_HEADING,
  FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK,
  FIRST_PILOT_OPERATE_UNLOCK_WHY_TWO,
} from "@/lib/vocabulary/first-pilot-operate-unlock-vocabulary";

describe("FirstPilotOperateUnlockVocabularyRail (TB-2311)", () => {
  it("renders first-pilot strip with peer link to Operate unlock", () => {
    render(<FirstPilotOperateUnlockVocabularyRail currentSurfaceId="first-pilot" />);

    const strip = screen.getByTestId("first-pilot-operate-unlock-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "first-pilot");
    expect(strip.textContent ?? "").toContain(FIRST_PILOT_OPERATE_UNLOCK_COMPACT_LINE);

    const peer = screen.getByTestId("first-pilot-operate-unlock-vocabulary-peer-link");
    expect(peer).toHaveTextContent(FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK.label);
    expect(peer).toHaveAttribute("href", FIRST_PILOT_OPERATE_UNLOCK_OPERATE_UNLOCK_LINK.href);
  });

  it("renders operate-unlock strip with peer link to first pilot", () => {
    render(<FirstPilotOperateUnlockVocabularyRail currentSurfaceId="operate-unlock" />);

    const peer = screen.getByTestId("first-pilot-operate-unlock-vocabulary-peer-link");
    expect(peer).toHaveTextContent(FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK.label);
    expect(peer).toHaveAttribute("href", FIRST_PILOT_OPERATE_UNLOCK_FIRST_PILOT_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <FirstPilotOperateUnlockVocabularyRail
        currentSurfaceId="first-pilot"
        variant="full"
      />,
    );

    expect(screen.getByText(FIRST_PILOT_OPERATE_UNLOCK_HEADING)).toBeInTheDocument();
    expect(screen.getByText(FIRST_PILOT_OPERATE_UNLOCK_WHY_TWO)).toBeInTheDocument();
  });
});
