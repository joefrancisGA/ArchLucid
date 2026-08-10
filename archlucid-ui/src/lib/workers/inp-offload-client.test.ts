import { afterEach, describe, expect, it, vi } from "vitest";

import { resetInpOffloadWorkerForTests, runInpOffloadTask } from "@/lib/workers/inp-offload-client";
import { runInpOffloadTaskSync } from "@/lib/workers/inp-offload-tasks";

describe("inp-offload-client (TB-2166)", () => {
  afterEach(() => {
    resetInpOffloadWorkerForTests();
    vi.unstubAllGlobals();
  });

  it("falls back to sync tasks when workers are unavailable", async () => {
    const expected = runInpOffloadTaskSync("manifestLineDiff", {
      beforeText: "alpha",
      afterText: "beta",
    });

    const result = await runInpOffloadTask("manifestLineDiff", {
      beforeText: "alpha",
      afterText: "beta",
    });

    expect(result).toEqual(expected);
  });

  it("uses the worker when construction succeeds", async () => {
    const postMessage = vi.fn();
    const addEventListener = vi.fn((eventName: string, handler: (event: MessageEvent) => void) => {
      if (eventName !== "message") {
        return;
      }

      postMessage.mockImplementation((message: { id: string }) => {
        handler({
          data: {
            id: message.id,
            ok: true,
            kind: "manifestLineDiff",
            result: [{ kind: "equal", prefix: " ", text: "same" }],
          },
        } as MessageEvent["data"]);
      });
    });

    class MockWorker {
      public addEventListener = addEventListener;
      public removeEventListener = vi.fn();
      public postMessage = postMessage;
      public terminate = vi.fn();
    }

    vi.stubGlobal("Worker", MockWorker as unknown as typeof Worker);

    const result = await runInpOffloadTask("manifestLineDiff", {
      beforeText: "alpha",
      afterText: "alpha",
    });

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ kind: "equal", prefix: " ", text: "same" }]);
  });
});
