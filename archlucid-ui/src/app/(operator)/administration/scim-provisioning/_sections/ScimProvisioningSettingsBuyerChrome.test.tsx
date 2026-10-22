import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { ScimProvisioningSettingsBuyerChrome } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsBuyerChrome";
import { SCIM_PROVISIONING_FOLLOW_UPS_TITLE } from "@/lib/scim-provisioning-evidence-copy";

describe("ScimProvisioningSettingsBuyerChrome (ASC)", () => {
  it("mounts tab-level Sources orientation in buyer shell", () => {
    render(<ScimProvisioningSettingsBuyerChrome />);

    expect(screen.getByTestId("scim-provisioning-orientation-bottom")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SCIM_PROVISIONING_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("scim-provisioning-settings-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("scim-provisioning-settings-claim-discipline")).not.toBeInTheDocument();
  });
});
