import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
  };
});

import { TENANT_SETTINGS_SETTINGS_ORIENTATION_BOTTOM_TEST_ID } from "@/lib/tenant-settings-settings-page-copy";

import { TenantSettingsSettingsBuyerChrome } from "./TenantSettingsSettingsBuyerChrome";

describe("TenantSettingsSettingsBuyerChrome", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
  });

  it("renders bottom orientation strip in buyer shell", () => {
    render(<TenantSettingsSettingsBuyerChrome />);

    expect(screen.getByTestId(TENANT_SETTINGS_SETTINGS_ORIENTATION_BOTTOM_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("tenant-settings-settings-sources")).toBeInTheDocument();
  });

  it("returns null outside buyer shell", () => {
    demoEnvMock.buyerPolished = false;

    const { container } = render(<TenantSettingsSettingsBuyerChrome />);

    expect(container).toBeEmptyDOMElement();
  });
});
