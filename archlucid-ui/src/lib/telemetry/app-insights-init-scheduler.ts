/**
 * Defer non-critical Application Insights SDK load until the browser is idle (TB-572 / PERF-13).
 */
export function scheduleDeferredAppInsightsInit(onInit: () => void): () => void {
  const init = (): void => {
    onInit();
  };

  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(init);

    return () => {
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = window.setTimeout(init, 1);

  return () => {
    window.clearTimeout(timeoutId);
  };
}
