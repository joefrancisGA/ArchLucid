import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { AdministrationConnectionStatusBuyerChrome } from "@/app/(operator)/administration/connection-status/AdministrationConnectionStatusBuyerChrome";
import { CONNECTION_STATUS_FOLLOW_UPS_TITLE } from "@/lib/connection-status-evidence-copy";

describe("AdministrationConnectionStatusBuyerChrome (ADC)", () => {
  it("mounts tab-level Sources orientation in buyer shell", () => {
    render(<AdministrationConnectionStatusBuyerChrome />);

    expect(screen.getByTestId("connection-status-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CONNECTION_STATUS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("connection-status-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("connection-status-claim-discipline")).not.toBeInTheDocument();
  });
});
