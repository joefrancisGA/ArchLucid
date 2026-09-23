import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SessionAiReadinessProvider,
  useSessionAiReadiness,
} from "@/hooks/session-ai-readiness-context";
import type { SessionAiReadinessState } from "@/hooks/use-session-ai-readiness-core";

const readinessState: SessionAiReadinessState = {
  sessionMode: "Simulator",
  hostMode: "Simulator",
  hasDevOverride: false,
  isSessionReal: false,
  isLoading: false,
  isReady: true,
  blocksExecute: false,
  detail: null,
  availability: null,
  probeState: { status: "idle" },
  checkAvailability: vi.fn(async () => {}),
};

vi.mock("@/hooks/use-session-ai-readiness-core", () => ({
  useSessionAiReadinessCore: vi.fn(() => readinessState),
}));

import { useSessionAiReadinessCore } from "@/hooks/use-session-ai-readiness-core";

describe("useSessionAiReadiness", () => {
  it("keeps hook order stable when requireLiveProbe toggles", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionAiReadinessProvider>{children}</SessionAiReadinessProvider>
    );

    const { rerender } = renderHook(
      ({ requireLiveProbe }: { requireLiveProbe: boolean }) =>
        useSessionAiReadiness({ requireLiveProbe }),
      {
        wrapper,
        initialProps: { requireLiveProbe: false },
      },
    );

    expect(useSessionAiReadinessCore).toHaveBeenCalled();

    rerender({ requireLiveProbe: true });

    expect(useSessionAiReadinessCore).toHaveBeenCalledTimes(4);
  });
});
