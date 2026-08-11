import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/GovernanceSetupConfigHubsVocabularyRail";
import {
  GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE,
  GOVERNANCE_SETUP_CONFIG_HUBS_HEADING,
  GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK,
  GOVERNANCE_SETUP_CONFIG_HUBS_WHY_SEPARATE,
} from "@/lib/vocabulary/governance-setup-config-hubs-vocabulary";

describe("GovernanceSetupConfigHubsVocabularyRail (TB-2297)", () => {
  it("renders setup strip with peer links to live hubs", () => {
    render(<GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="setup" />);

    const strip = screen.getByTestId("governance-setup-config-hubs-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "setup");
    expect(strip.textContent ?? "").toContain(GOVERNANCE_SETUP_CONFIG_HUBS_COMPACT_LINE);

    const alertPeer = screen.getByTestId("governance-setup-config-hubs-vocabulary-peer-alert-rules");
    expect(alertPeer).toHaveTextContent(GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK.label);
    expect(alertPeer).toHaveAttribute("href", GOVERNANCE_SETUP_CONFIG_HUBS_ALERT_RULES_LINK.href);
  });

  it("renders alert-rules strip with setup peer first", () => {
    render(<GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="alert-rules" />);

    const setupPeer = screen.getByTestId("governance-setup-config-hubs-vocabulary-peer-setup");
    expect(setupPeer).toHaveTextContent(GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK.label);
    expect(setupPeer).toHaveAttribute("href", GOVERNANCE_SETUP_CONFIG_HUBS_SETUP_LINK.href);
  });

  it("renders full variant with why-separate explanation", () => {
    render(
      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="setup" variant="full" />,
    );

    expect(screen.getByText(GOVERNANCE_SETUP_CONFIG_HUBS_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_SETUP_CONFIG_HUBS_WHY_SEPARATE)).toBeInTheDocument();
  });
});
