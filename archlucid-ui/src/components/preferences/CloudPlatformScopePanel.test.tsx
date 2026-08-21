import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CloudPlatformScopePanel } from "@/components/preferences/CloudPlatformScopePanel";
import { PREFERENCES_CLOUD_PLATFORMS_EMPTY_SELECTION_MESSAGE } from "@/lib/cloud-platform-scope-copy";
import { DEFAULT_CLOUD_PLATFORM_SCOPE } from "@/lib/cloud-platform-scope-storage";

describe("CloudPlatformScopePanel", () => {
  it("blocks hiding the last visible provider and offers show-all reset", () => {
    const onScopeChange = vi.fn();

    render(
      <CloudPlatformScopePanel
        scope={{ ...DEFAULT_CLOUD_PLATFORM_SCOPE, aws: false, azure: false }}
        onScopeChange={onScopeChange}
        labelledById="preferences-cloud-platforms-heading"
      />,
    );

    fireEvent.click(screen.getByTestId("cloud-platform-scope-gcp"));
    expect(onScopeChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("cloud-platform-scope-empty-selection")).toHaveTextContent(
      PREFERENCES_CLOUD_PLATFORMS_EMPTY_SELECTION_MESSAGE,
    );

    fireEvent.click(screen.getByTestId("cloud-platform-scope-show-all"));
    expect(onScopeChange).toHaveBeenCalledWith(DEFAULT_CLOUD_PLATFORM_SCOPE);
  });
});
