import { afterEach, describe, expect, it } from "vitest";

import {
  orientationSourcesAutoOpenDismissStorageKey,
  readOrientationSourcesAutoOpenDismissed,
  resolveOrientationSourcesInitialOpen,
  writeOrientationSourcesAutoOpenDismissed,
} from "@/lib/usability/orientation-sources-auto-open-preference";

describe("orientation-sources-auto-open-preference", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("auto-opens for pre-commit workspaces until the reader dismisses the strip", () => {
    expect(
      resolveOrientationSourcesInitialOpen({
        urlParamOpen: false,
        userDismissed: false,
        workspacePreCommit: true,
      }),
    ).toBe(true);

    writeOrientationSourcesAutoOpenDismissed("help-notifications-sources");

    expect(readOrientationSourcesAutoOpenDismissed("help-notifications-sources")).toBe(true);
    expect(
      resolveOrientationSourcesInitialOpen({
        urlParamOpen: false,
        userDismissed: true,
        workspacePreCommit: true,
      }),
    ).toBe(false);
  });

  it("honors explicit URL open params over dismiss state", () => {
    writeOrientationSourcesAutoOpenDismissed("help-notifications-sources");

    expect(
      resolveOrientationSourcesInitialOpen({
        urlParamOpen: true,
        userDismissed: true,
        workspacePreCommit: true,
      }),
    ).toBe(true);
  });

  it("uses a stable per-surface dismiss storage key", () => {
    expect(orientationSourcesAutoOpenDismissStorageKey("help-notifications-sources")).toContain(
      "help-notifications-sources",
    );
  });
});
