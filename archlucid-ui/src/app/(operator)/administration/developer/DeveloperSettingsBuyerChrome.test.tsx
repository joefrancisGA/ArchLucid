import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { DeveloperSettingsBuyerChrome } from "@/app/(operator)/administration/developer/DeveloperSettingsBuyerChrome";
import { DEVELOPER_SETTINGS_FOLLOW_UPS_TITLE } from "@/lib/developer-settings-evidence-copy";

describe("DeveloperSettingsBuyerChrome (SDX)", () => {
  it("mounts tab-level Sources orientation in buyer shell", () => {
    render(<DeveloperSettingsBuyerChrome />);

    expect(screen.getByTestId("developer-settings-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: DEVELOPER_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("developer-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("developer-settings-claim-discipline")).not.toBeInTheDocument();
  });
});
