/** Parses SSE frames from a byte stream (event + data lines). */
export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (eventName: string, data: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";
  let dataLines: string[] = [];

  const flushEvent = () => {
    if (dataLines.length === 0) {
      currentEvent = "message";

      return;
    }

    onEvent(currentEvent, dataLines.join("\n"));
    dataLines = [];
    currentEvent = "message";
  };

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();

      if (done) {
        flushEvent();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let lineBreakIndex = buffer.indexOf("\n");

      while (lineBreakIndex >= 0) {
        let line = buffer.slice(0, lineBreakIndex);
        buffer = buffer.slice(lineBreakIndex + 1);

        if (line.endsWith("\r")) {
          line = line.slice(0, -1);
        }

        if (line.length === 0) {
          flushEvent();
        } else if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }

        lineBreakIndex = buffer.indexOf("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}
