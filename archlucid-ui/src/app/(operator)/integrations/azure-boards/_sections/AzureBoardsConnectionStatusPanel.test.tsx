import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzureBoardsConnectionStatusPanel } from "./AzureBoardsConnectionStatusPanel";

describe("AzureBoardsConnectionStatusPanel", () => {
  it("renders connection status and zone recoveries", () => {
    render(
      <AzureBoardsConnectionStatusPanel
        connectionStatus={{
          status: "setup-incomplete",
          label: "Setup incomplete",
          explanation: "Save Azure Boards connection settings to continue.",
          nextAction: "Enter organization URL and token reference.",
        }}
        integrationZoneRecoveries={[
          {
            zoneId: "settings",
            zoneLabel: "Azure Boards settings",
            presentation: {
              whatFailed: "Could not load Azure Boards settings.",
              whatIsIntact: "Connection settings remain available.",
              nextStep: "Retry loading settings.",
            },
          },
        ]}
      />,
    );

    expect(screen.getByTestId("azure-boards-connection-status")).toBeInTheDocument();
    expect(screen.getByText("Setup incomplete")).toBeInTheDocument();
    expect(screen.getByText(/Save Azure Boards connection settings/)).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-zone-recoveries")).toBeInTheDocument();
    expect(screen.getByText(/Could not load Azure Boards settings/)).toBeInTheDocument();
  });
});
