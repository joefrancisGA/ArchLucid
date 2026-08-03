/**
 * Next.js instrumentation hook — server boot + request-error telemetry.
 * Proxy BFF timing lives in `lib/telemetry/server-request-timing.ts` (Server-Timing headers).
 */

export async function register(): Promise<void> {
  // Edge and Node both load this file; keep registration side-effect free beyond a boot marker.
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  if (process.env.ARCHLUCID_UI_SERVER_TIMING_BOOT_LOG === "1") {
    console.info(
      JSON.stringify({
        component: "archlucid-ui-server-timing",
        event: "instrumentation_registered",
        runtime: process.env.NEXT_RUNTIME ?? "nodejs",
      }),
    );
  }
}

type RequestErrorContext = {
  routerKind?: string;
  routePath?: string;
  routeType?: string;
  renderSource?: string;
};

/** Structured log for uncaught Next.js request errors (no request bodies / PII). */
export function onRequestError(
  error: { digest?: string } & Error,
  request: Readonly<{ path: string; method: string; headers: NodeJS.Dict<string | string[]> }>,
  context: RequestErrorContext,
): void {
  const path = typeof request.path === "string" ? request.path.split("?")[0] ?? "/" : "/";

  console.error(
    JSON.stringify({
      component: "archlucid-ui-server-timing",
      event: "request_error",
      method: request.method,
      path,
      digest: error.digest,
      name: error.name,
      message: error.message.slice(0, 240),
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    }),
  );
}
