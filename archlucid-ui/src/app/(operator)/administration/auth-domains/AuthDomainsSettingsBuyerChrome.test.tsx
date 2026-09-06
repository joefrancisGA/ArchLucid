import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { AuthDomainsSettingsBuyerChrome } from "@/app/(operator)/administration/auth-domains/AuthDomainsSettingsBuyerChrome";
import { AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE } from "@/lib/auth-domains-settings-evidence-copy";

describe("AuthDomainsSettingsBuyerChrome (ADU)", () => {
  it("mounts tab-level Sources orientation in buyer shell", () => {
    render(<AuthDomainsSettingsBuyerChrome />);

    expect(screen.getByTestId("auth-domains-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUTH_DOMAINS_SETTINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-domains-settings-claim-discipline")).not.toBeInTheDocument();
  });
});
