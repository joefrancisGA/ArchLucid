import { describe, expect, it, vi } from "vitest";

import { consumeSseStream } from "./ask-sse-stream";

function sseBody(frames: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(frames);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

describe("consumeSseStream ack handling", () => {
  it("delivers ack events without treating them as tokens or errors", async () => {
    const onEvent = vi.fn();

    await consumeSseStream(
      sseBody('id: 1\nevent: ack\ndata: {"status":"started"}\n\nid: 2\nevent: token\ndata: {"text":"Hi"}\n\n'),
      onEvent,
    );

    expect(onEvent).toHaveBeenCalledWith("ack", '{"status":"started"}');
    expect(onEvent).toHaveBeenCalledWith("token", '{"text":"Hi"}');
  });
});
