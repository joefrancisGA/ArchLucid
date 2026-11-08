"use strict";

// CI diagnostics: Node/Vitest coordinator AND worker-process heap/RSS/GC visibility.
// Existing VITEST_MEMORY_FILE hook measures only an individual test-file worker.
// NODE_OPTIONS --require loads this in the coordinating Node process as well.
// No changes to test selection, worker count, heap limits, assertions or GC policy.
if (process.env.CI === "true" && process.env.ARCHLUCID_VITEST_PROCESS_TELEMETRY === "1") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS preload required by Node --require, before Vitest initializes.
  const { PerformanceObserver } = require("node:perf_hooks");
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS preload required by Node --require, before Vitest initializes.
  const { getHeapStatistics } = require("node:v8");
  const started = process.hrtime.bigint();
  const intervalMs = 5000;
  let samples = 0;
  let peakObservedRssBytes = 0;
  let peakObservedHeapUsedBytes = 0;
  let gcEvents = 0;
  let gcDurationMs = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      gcEvents += 1;
      gcDurationMs += entry.duration;
    }
  });
  observer.observe({ entryTypes: ["gc"] });

  function sample(phase) {
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    const memory = process.memoryUsage();
    samples += 1;
    peakObservedRssBytes = Math.max(peakObservedRssBytes, memory.rss);
    peakObservedHeapUsedBytes = Math.max(peakObservedHeapUsedBytes, memory.heapUsed);

    // Avoid an extra line for every tiny fork. Coordinators and expensive
    // workers survive >=5s and are sampled regularly, including before OOM.
    if (elapsedMs < intervalMs && phase === "exit") return;

    const record = {
      phase,
      pid: process.pid,
      ppid: process.ppid,
      script: process.argv[1]?.split(/[\\/]/).slice(-3).join("/") ?? "",
      elapsedMs,
      samples,
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapLimitBytes: getHeapStatistics().heap_size_limit,
      peakObservedRssBytes,
      peakObservedHeapUsedBytes,
      // Linux process-lifetime peak in KiB; not a per-cohort peak.
      processMaxRssKiB: process.resourceUsage().maxRSS,
      gcEvents,
      gcDurationMs,
    };
    try {
      process.stdout.write("VITEST_PROCESS_MEMORY " + JSON.stringify(record) + "\n");
    } catch {
      // Never turn diagnostic reporting into a failed test.
    }
  }

  const interval = setInterval(() => sample("sample"), intervalMs);
  interval.unref();
  process.on("exit", () => sample("exit"));
}
