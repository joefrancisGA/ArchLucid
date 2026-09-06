import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { OperatorSecurityTrustBuyerChrome } from "@/app/(operator)/administration/security-trust/_sections/OperatorSecurityTrustBuyerChrome";
import { SETTINGS_SECURITY_TRUST_FOLLOW_UPS_TITLE } from "@/lib/settings-security-trust-evidence-copy";

describe("OperatorSecurityTrustBuyerChrome (WSX)", () => {
  it("mounts tab-level Sources orientation in buyer shell", () => {
    render(<OperatorSecurityTrustBuyerChrome />);

    expect(screen.getByTestId("operator-security-trust-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SETTINGS_SECURITY_TRUST_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("settings-security-trust-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-security-trust-claim-discipline")).not.toBeInTheDocument();
  });
});
