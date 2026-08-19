import { beforeEach, describe, expect, it, vi } from "vitest";

const toastMocks = vi.hoisted(() => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/lib/toast", () => toastMocks);

import {
  presentWebhookConnectionTestRequestFailure,
  presentWebhookConnectionTestToasts,
} from "./webhook-subscription-connection-test";

describe("presentWebhookConnectionTestToasts", () => {
  beforeEach(() => {
    toastMocks.showSuccess.mockReset();
    toastMocks.showError.mockReset();
  });

  it("shows success toast for 2xx transport", () => {
    presentWebhookConnectionTestToasts({
      transportSucceeded: true,
      statusCode: 204,
      reasonPhrase: "No Content",
      responseBodyTruncated: false,
    });

    expect(toastMocks.showSuccess).toHaveBeenCalledWith("Test event delivered. HTTP 204");
    expect(toastMocks.showError).not.toHaveBeenCalled();
  });

  it("shows error toast for non-2xx HTTP response", () => {
    presentWebhookConnectionTestToasts({
      transportSucceeded: true,
      statusCode: 500,
      reasonPhrase: "Internal Server Error",
      responseBodyPreview: "boom",
      responseBodyTruncated: false,
    });

    expect(toastMocks.showError).toHaveBeenCalledWith("Test event returned HTTP 500", "Internal Server Error");
  });

  it("shows error toast when transport fails", () => {
    presentWebhookConnectionTestToasts({
      transportSucceeded: false,
      statusCode: 0,
      error: "Connection refused",
      responseBodyTruncated: false,
    });

    expect(toastMocks.showError).toHaveBeenCalledWith(
      "We could not reach the destination.",
      "Connection refused",
    );
  });
});

describe("presentWebhookConnectionTestRequestFailure", () => {
  beforeEach(() => {
    toastMocks.showSuccess.mockReset();
    toastMocks.showError.mockReset();
  });

  it("shows request failure toast", () => {
    presentWebhookConnectionTestRequestFailure(new Error("Network down"));

    expect(toastMocks.showError).toHaveBeenCalledWith("We could not reach the destination.", "Network down");
  });
});
