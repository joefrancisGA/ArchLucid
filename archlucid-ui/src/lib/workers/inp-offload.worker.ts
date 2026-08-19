import { dispatchInpOffloadRequest } from "@/lib/workers/inp-offload-tasks";
import type { InpOffloadRequest, InpOffloadResponse } from "@/lib/workers/inp-offload-contract";

self.addEventListener("message", (event: MessageEvent<InpOffloadRequest>) => {
  if (event.origin !== "" && event.origin !== self.location.origin) {
    return;
  }

  const request = event.data;

  try {
    const result = dispatchInpOffloadRequest(request);
    const response: InpOffloadResponse = {
      id: request.id,
      ok: true,
      kind: request.kind,
      result,
    };

    self.postMessage(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "INP offload task failed";
    const response: InpOffloadResponse = {
      id: request.id,
      ok: false,
      error: message,
    };

    self.postMessage(response);
  }
});

export {};
