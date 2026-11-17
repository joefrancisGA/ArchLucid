import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";

describe("PreferenceAccountSyncStatus", () => {
  it("renders nothing when account sync is idle", () => {
    const { container } = render(
      <PreferenceAccountSyncStatus
        accountSyncState="idle"
        localOnlyMessage="Local only"
        testIdPrefix="test-preference"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when account sync is synced (saved feedback lives on the control)", () => {
    const { container } = render(
      <PreferenceAccountSyncStatus
        accountSyncState="synced"
        localOnlyMessage="Local only"
        testIdPrefix="test-preference"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders local-only failure as an alert", () => {
    render(
      <PreferenceAccountSyncStatus
        accountSyncState="local-only"
        localOnlyMessage="Saved on this device only."
        testIdPrefix="test-preference"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Saved on this device only.");
  });
});
