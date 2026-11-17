import { PerformanceObserver } from "node:perf_hooks";
import { getHeapStatistics } from "node:v8";
import { afterAll, afterEach, beforeAll, expect } from "vitest";

// Diagnostic-only: no changes to Vitest isolation, heap limits, assertions, or test selection.
// One log record is emitted per test file; the pool has one worker per CI cohort.
if (process.env.CI === "true" && process.env.ARCHLUCID_VITEST_MEMORY_TELEMETRY !== "0") {
  const start = process.hrtime.bigint();
  let testPath = null;
  let samples = 0;
  let peakObservedHeapUsedBytes = 0;
  let peakObservedRssBytes = 0;
  let gcEvents = 0;
  let gcDurationMs = 0;
  const heartbeatIntervalMs = 5_000;
  let heartbeatInterval = null;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      gcEvents += 1;
      gcDurationMs += entry.duration;
    }
  });
  observer.observe({ entryTypes: ["gc"] });

  function sample() {
    const memory = process.memoryUsage();
    samples += 1;
    peakObservedHeapUsedBytes = Math.max(peakObservedHeapUsedBytes, memory.heapUsed);
    peakObservedRssBytes = Math.max(peakObservedRssBytes, memory.rss);
    return memory;
  }

  function emitLiveWorkerSample() {
    const memory = sample();
    // The worker can OOM before afterAll. Emit in-process samples while the
    // file is running, rather than sampling only the Vitest coordinator.
    console.info("VITEST_MEMORY_FILE_SAMPLE " + JSON.stringify({
      testPath, pid: process.pid,
      elapsedMs: Number(process.hrtime.bigint() - start) / 1e6,
      samples, rssBytes: memory.rss, heapUsedBytes: memory.heapUsed,
      peakObservedRssBytes, peakObservedHeapUsedBytes,
      heapLimitBytes: getHeapStatistics().heap_size_limit,
      processMaxRssKiB: process.resourceUsage().maxRSS,
      gcEvents, gcDurationMs,
    }));
  }

  beforeAll(() => {
    sample();
    // Log the identity before a test runs, so an OOM that kills its worker
    // before afterAll cannot erase which file was being executed.
    const state = expect.getState();
    if (typeof state.testPath === "string") testPath = state.testPath;
    console.info("VITEST_MEMORY_FILE_START " + JSON.stringify({ testPath, pid: process.pid }));
    heartbeatInterval = setInterval(emitLiveWorkerSample, heartbeatIntervalMs);
    heartbeatInterval.unref();
  });
  afterEach(() => {
    sample();
    const state = expect.getState();
    if (typeof state.testPath === "string") testPath = state.testPath;
  });
  afterAll(() => {
    if (heartbeatInterval !== null) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    const memory = sample();
    observer.disconnect();
    // processMaxRssKiB is a process-lifetime peak; unlike observed peaks it is NOT a file peak.
    const record = {
      testPath, pid: process.pid,
      durationMs: Number(process.hrtime.bigint() - start) / 1e6,
      samples, rssEndBytes: memory.rss, heapUsedEndBytes: memory.heapUsed,
      peakObservedRssBytes, peakObservedHeapUsedBytes,
      heapLimitBytes: getHeapStatistics().heap_size_limit,
      processMaxRssKiB: process.resourceUsage().maxRSS,
      gcEvents, gcDurationMs,
    };
    console.info("VITEST_MEMORY_FILE " + JSON.stringify(record));
  });
}
