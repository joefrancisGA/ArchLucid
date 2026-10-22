import { beforeEach, describe, expect, it } from "vitest";

import {
  QUICK_SCAN_BROWSER_STORAGE_KEY,
  QUICK_SCAN_SESSION_STORAGE_KEY,
  ensureBrowserId,
  ensureSessionId,
} from "@/app/(marketing)/quick-scan/quick-scan-session";

describe("quick-scan-session identity helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("ensureSessionId trims whitespace-padded localStorage values before returning them", () => {
    window.localStorage.setItem(QUICK_SCAN_SESSION_STORAGE_KEY, " session-id ");

    expect(ensureSessionId()).toBe("session-id");
    expect(window.localStorage.getItem(QUICK_SCAN_SESSION_STORAGE_KEY)).toBe("session-id");
  });

  it("ensureBrowserId trims whitespace-padded localStorage values before returning them", () => {
    window.localStorage.setItem(QUICK_SCAN_BROWSER_STORAGE_KEY, " browser-id ");

    expect(ensureBrowserId()).toBe("browser-id");
    expect(window.localStorage.getItem(QUICK_SCAN_BROWSER_STORAGE_KEY)).toBe("browser-id");
  });
});
