import { describe, expect, it } from "vitest";

import { formatBlockingOverlayFailure } from "./blocking-overlay-failure";

describe("formatBlockingOverlayFailure", () => {
  it("reports the chooser and target when cleanup leaves a backdrop", () => {
    const message = formatBlockingOverlayFailure({
      pageUrl: "http://localhost:3000/architecture/reviews/new?baseline=1",
      overlayCount: 1,
      chooserVisible: true,
      liveActionEnabled: false,
      visibleDialogTestIds: ["first-session-purpose-chooser"],
      targetDescription: "button:Next",
    });

    expect(message).toBe(
      "[session-purpose-overlay] Blocking overlay remained after cleanup. URL: http://localhost:3000/architecture/reviews/new?baseline=1. Overlay count: 1. Chooser visible: yes. Live action enabled: no. Visible dialogs: first-session-purpose-chooser. Target: button:Next.",
    );
  });
});
