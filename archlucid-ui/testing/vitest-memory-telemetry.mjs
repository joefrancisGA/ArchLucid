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

  beforeAll(() => { sample(); });
  afterEach(() => {
    sample();
    const state = expect.getState();
    if (typeof state.testPath === "string") testPath = state.testPath;
  });
  afterAll(() => {
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
