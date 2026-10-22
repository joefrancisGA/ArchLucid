import { isDocumentVisible, type ClientDiagnosticsReporter } from "./client-runtime-diagnostics-types";

export const HEARTBEAT_MS = 2_000;
export const STALL_THRESHOLD_MS = 5_000;
export const LONG_TASK_STALL_MS = 5_000;

function formatMainThreadStallDetail(params: {
  readonly thresholdMs: number;
  readonly source: "heartbeat" | "longtask";
  readonly gapMs?: number;
  readonly hiddenSinceLastBeat?: boolean;
  readonly longTaskDurationMs?: number;
  readonly attribution?: string;
}): string {
  const parts = [
    `thresholdMs=${params.thresholdMs}`,
    `source=${params.source}`,
    `visibilityState=${document.visibilityState}`,
  ];

  if (params.gapMs !== undefined) {
    parts.push(`gapMs=${params.gapMs}`);
  }

  if (params.hiddenSinceLastBeat !== undefined) {
    parts.push(`hiddenSinceLastBeat=${params.hiddenSinceLastBeat}`);
  }

  if (params.longTaskDurationMs !== undefined) {
    parts.push(`longTaskDurationMs=${Math.round(params.longTaskDurationMs)}`);
  }

  if (params.attribution !== undefined && params.attribution.length > 0) {
    parts.push(`attribution=${params.attribution}`);
  }

  return parts.join(";");
}

export type MainThreadStallProbe = {
  readonly dispose: () => void;
};

export function installMainThreadStallProbe(report: ClientDiagnosticsReporter): MainThreadStallProbe {
  let disposed = false;
  let lastHeartbeatMs = Date.now();
  let stallReported = false;
  let hiddenSinceLastBeat = false;
  let longTaskObserverActive = false;

  const reportMainThreadStall = (params: {
    readonly message: string;
    readonly source: "heartbeat" | "longtask";
    readonly gapMs?: number;
    readonly hiddenSinceLastBeat?: boolean;
    readonly longTaskDurationMs?: number;
    readonly attribution?: string;
  }): void => {
    if (stallReported) {
      return;
    }

    stallReported = true;
    report({
      kind: "main-thread-stall",
      message: params.message,
      detail: formatMainThreadStallDetail({
        thresholdMs: STALL_THRESHOLD_MS,
        source: params.source,
        gapMs: params.gapMs,
        hiddenSinceLastBeat: params.hiddenSinceLastBeat,
        longTaskDurationMs: params.longTaskDurationMs,
        attribution: params.attribution,
      }),
    });
  };

  const onVisibilityChange = (): void => {
    if (disposed) {
      return;
    }

    if (!isDocumentVisible()) {
      hiddenSinceLastBeat = true;

      return;
    }

    lastHeartbeatMs = Date.now();
    hiddenSinceLastBeat = false;
  };

  const heartbeatTimer = setInterval(() => {
    if (disposed) {
      return;
    }

    if (!isDocumentVisible()) {
      hiddenSinceLastBeat = true;

      return;
    }

    const now = Date.now();
    const gap = now - lastHeartbeatMs;
    lastHeartbeatMs = now;

    if (longTaskObserverActive) {
      hiddenSinceLastBeat = false;

      return;
    }

    if (gap >= STALL_THRESHOLD_MS) {
      reportMainThreadStall({
        message: `Main thread heartbeat delayed by ${gap}ms`,
        source: "heartbeat",
        gapMs: gap,
        hiddenSinceLastBeat,
      });
    }

    hiddenSinceLastBeat = false;
  }, HEARTBEAT_MS);

  let longTaskObserver: PerformanceObserver | null = null;

  try {
    if (typeof PerformanceObserver !== "undefined") {
      longTaskObserver = new PerformanceObserver((list) => {
        if (disposed || !isDocumentVisible()) {
          return;
        }

        for (const entry of list.getEntries()) {
          if (entry.duration < LONG_TASK_STALL_MS) {
            continue;
          }

          const longTaskEntry = entry as PerformanceEntry & {
            attribution?: ReadonlyArray<{ name?: string; containerType?: string; containerSrc?: string }>;
          };
          const attribution = longTaskEntry.attribution
            ?.map((item) => item.name ?? item.containerType ?? item.containerSrc)
            .filter((value): value is string => typeof value === "string" && value.length > 0)
            .join("|");

          reportMainThreadStall({
            message: `Main thread long task ${Math.round(entry.duration)}ms`,
            source: "longtask",
            longTaskDurationMs: entry.duration,
            attribution,
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
      longTaskObserverActive = true;
    }
  } catch {
    longTaskObserverActive = false;
  }

  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    dispose: () => {
      disposed = true;
      clearInterval(heartbeatTimer);
      longTaskObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
