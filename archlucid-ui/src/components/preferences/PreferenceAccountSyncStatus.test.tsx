import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import { PREFERENCE_ACCOUNT_SYNCED_MESSAGE } from "@/lib/preference-account-sync-copy";

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

  it("announces saved-to-account feedback when synced", () => {
    render(
      <PreferenceAccountSyncStatus
        accountSyncState="synced"
        localOnlyMessage="Local only"
        testIdPrefix="test-preference"
      />,
    );

    expect(screen.getByTestId("test-preference-sync-status")).toHaveTextContent(PREFERENCE_ACCOUNT_SYNCED_MESSAGE);
    expect(screen.getByTestId("test-preference-sync-status")).toHaveAttribute("aria-live", "polite");
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
