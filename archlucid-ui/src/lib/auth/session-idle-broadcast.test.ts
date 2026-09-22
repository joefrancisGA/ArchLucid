import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  postSessionIdleBroadcastMessage,
  subscribeSessionIdleBroadcast,
} from "./session-idle-broadcast";
import { SESSION_IDLE_BROADCAST_CHANNEL } from "./session-idle-timeout";

type MockBroadcastChannel = {
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

describe("session-idle-broadcast (LW-083 / LW-088)", () => {
  let channels: MockBroadcastChannel[];

  beforeEach(() => {
    channels = [];

    class TestBroadcastChannel implements MockBroadcastChannel {
      postMessage = vi.fn();
      close = vi.fn();
      addEventListener = vi.fn();
      removeEventListener = vi.fn();

      constructor(public readonly name: string) {
        channels.push(this);
      }
    }

    vi.stubGlobal("BroadcastChannel", TestBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts auth-cleared without token material", () => {
    postSessionIdleBroadcastMessage({ type: "auth-cleared" });

    expect(channels).toHaveLength(1);
    expect(channels[0]?.name).toBe(SESSION_IDLE_BROADCAST_CHANNEL);
    expect(channels[0]?.postMessage).toHaveBeenCalledWith({ type: "auth-cleared" });
    expect(JSON.stringify(channels[0]?.postMessage.mock.calls[0]?.[0])).not.toMatch(/token/i);
  });

  it("delivers auth-cleared to subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionIdleBroadcast(listener);
    const channel = channels[0];
    const handler = channel?.addEventListener.mock.calls.find(([eventName]) => eventName === "message")?.[1] as
      | ((event: MessageEvent) => void)
      | undefined;

    handler?.({ data: { type: "auth-cleared" } } as MessageEvent);

    expect(listener).toHaveBeenCalledWith({ type: "auth-cleared" });

    unsubscribe();
    expect(channel?.close).toHaveBeenCalled();
  });
});
