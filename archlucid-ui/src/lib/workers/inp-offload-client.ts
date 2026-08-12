import { useEffect, useState } from "react";

import type {
  InpOffloadPayloadMap,
  InpOffloadResponse,
  InpOffloadResultMap,
  InpOffloadTaskKind,
} from "@/lib/workers/inp-offload-contract";
import { isInpOffloadSuccessResponse } from "@/lib/workers/inp-offload-contract";
import { runInpOffloadTaskSync } from "@/lib/workers/inp-offload-tasks";

const INP_OFFLOAD_WORKER_TIMEOUT_MS = 30_000;

let sharedWorker: Worker | null = null;
let workerUnavailable = false;

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `inp-offload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInpOffloadWorker(): Worker | null {
  if (typeof window === "undefined" || workerUnavailable) {
    return null;
  }

  if (sharedWorker !== null) {
    return sharedWorker;
  }

  try {
    sharedWorker = new Worker(new URL("./inp-offload.worker.ts", import.meta.url));
    sharedWorker.addEventListener("error", () => {
      workerUnavailable = true;
      sharedWorker?.terminate();
      sharedWorker = null;
    });

    return sharedWorker;
  } catch {
    workerUnavailable = true;
    return null;
  }
}

/** Runs an offload task in a Web Worker when available; otherwise on the main thread. */
export async function runInpOffloadTask<K extends InpOffloadTaskKind>(
  kind: K,
  payload: InpOffloadPayloadMap[K],
): Promise<InpOffloadResultMap[K]> {
  const worker = getInpOffloadWorker();

  if (worker === null) {
    return runInpOffloadTaskSync(kind, payload);
  }

  const id = createRequestId();

  return new Promise<InpOffloadResultMap[K]>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`INP offload task timed out after ${INP_OFFLOAD_WORKER_TIMEOUT_MS}ms`));
    }, INP_OFFLOAD_WORKER_TIMEOUT_MS);

    const onMessage = (event: MessageEvent<InpOffloadResponse<K>>): void => {
      if (event.data.id !== id) {
        return;
      }

      cleanup();

      if (!isInpOffloadSuccessResponse(event.data)) {
        reject(new Error(event.data.error));
        return;
      }

      resolve(event.data.result);
    };

    const onError = (): void => {
      cleanup();
      workerUnavailable = true;
      sharedWorker?.terminate();
      sharedWorker = null;

      try {
        resolve(runInpOffloadTaskSync(kind, payload));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("INP offload task failed"));
      }
    };

    const cleanup = (): void => {
      window.clearTimeout(timeout);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ id, kind, payload });
  });
}

export type UseInpOffloadTaskState<K extends InpOffloadTaskKind> = {
  readonly result: InpOffloadResultMap[K] | null;
  readonly pending: boolean;
  readonly error: string | null;
};

/**
 * Subscribes to an offload task whenever `payload` is defined.
 * Cancels in-flight work when inputs change.
 */
export function useInpOffloadTask<K extends InpOffloadTaskKind>(
  kind: K,
  payload: InpOffloadPayloadMap[K] | undefined,
  payloadKey: string,
): UseInpOffloadTaskState<K> {
  const [result, setResult] = useState<InpOffloadResultMap[K] | null>(null);
  const [pending, setPending] = useState(payload !== undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payload === undefined) {
      setResult(null);
      setPending(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setPending(true);
    setError(null);

    void runInpOffloadTask(kind, payload)
      .then((nextResult) => {
        if (!cancelled) {
          setResult(nextResult);
          setPending(false);
        }
      })
      .catch((caught: unknown) => {
        if (!canceled) {
          const message = caught instanceof Error ? caught.message : "INP offload task failed";
          setError(message);
          setResult(null);
          setPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind, payload, payloadKey]);

  return { result, pending, error };
}

/** Test-only reset so Vitest cases do not share worker state across files. */
export function resetInpOffloadWorkerForTests(): void {
  sharedWorker?.terminate();
  sharedWorker = null;
  workerUnavailable = false;
}
