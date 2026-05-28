/**
 * Bounded server-side fetch durations so Next.js SSG/RSC and the API proxy cannot hang indefinitely
 * when a host accepts TCP but never completes a response.
 */

/** Marketing/demo preview calls (build-time prerender, public demo hosts). */
export const MARKETING_UPSTREAM_FETCH_TIMEOUT_MS = 12_000;

/** Browser-originated proxy forwards to the ArchLucid API — allow typical latency but still cap hangs. */
export const PROXY_UPSTREAM_FETCH_TIMEOUT_MS = 60_000;

/** Server components and RSC loaders calling the API directly — cap hangs before the platform kills the route. */
export const SERVER_UPSTREAM_FETCH_TIMEOUT_MS = 45_000;
