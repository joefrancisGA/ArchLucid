import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_IDLE_BROADCAST_CHANNEL } from "@/lib/auth/session-idle-timeout";
import {
  isWorkingCareerRehearsalDoorBroadcastMessage,
  postWorkingCareerRehearsalDoorBroadcast,
  subscribeWorkingCareerRehearsalDoorBroadcast,
  WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE,
} from "@/lib/governance/working-career-rehearsal-door-broadcast";

type MockBroadcastChannel = {
  readonly name: string;
  postMessage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
};

describe("working-career-rehearsal-door-broadcast (CG-012)", () => {
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

  it("posts the door on the LW-083 operator channel without tokens", () => {
    postWorkingCareerRehearsalDoorBroadcast("rehearsal");

    expect(channels).toHaveLength(1);
    expect(channels[0]?.name).toBe(SESSION_IDLE_BROADCAST_CHANNEL);
    expect(channels[0]?.postMessage).toHaveBeenCalledWith({
      type: WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE,
      door: "rehearsal",
    });
    expect(JSON.stringify(channels[0]?.postMessage.mock.calls[0]?.[0])).not.toMatch(/token/i);
  });

  it("delivers working-career-rehearsal-door to subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeWorkingCareerRehearsalDoorBroadcast(listener);
    const channel = channels[0];
    const handler = channel?.addEventListener.mock.calls.find(([eventName]) => eventName === "message")?.[1] as
      | ((event: MessageEvent) => void)
      | undefined;

    handler?.({
      data: { type: WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE, door: "rehearsal" },
    } as MessageEvent);

    expect(listener).toHaveBeenCalledWith("rehearsal");

    unsubscribe();
    expect(channel?.close).toHaveBeenCalled();
  });

  it("ignores idle activity and auth-cleared on the shared channel", () => {
    const listener = vi.fn();
    subscribeWorkingCareerRehearsalDoorBroadcast(listener);
    const channel = channels[0];
    const handler = channel?.addEventListener.mock.calls.find(([eventName]) => eventName === "message")?.[1] as
      | ((event: MessageEvent) => void)
      | undefined;

    handler?.({ data: { type: "activity" } } as MessageEvent);
    handler?.({ data: { type: "auth-cleared" } } as MessageEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it("isWorkingCareerRehearsalDoorBroadcastMessage rejects unknown payloads", () => {
    expect(isWorkingCareerRehearsalDoorBroadcastMessage({ type: "auth-cleared" })).toBe(false);
    expect(
      isWorkingCareerRehearsalDoorBroadcastMessage({
        type: WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE,
        door: "simulator",
      }),
    ).toBe(false);
    expect(
      isWorkingCareerRehearsalDoorBroadcastMessage({
        type: WORKING_CAREER_REHEARSAL_DOOR_BROADCAST_TYPE,
        door: "rehearsal",
      }),
    ).toBe(true);
  });
});
