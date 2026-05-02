/**
 * Bounded server-side fetch durations so Next.js SSG/RSC and the API proxy cannot hang indefinitely
 * when a host accepts TCP but never completes a response.
 */

/** Marketing/demo preview calls (build-time prerender, public demo hosts). */
export const MARKETING_UPSTREAM_FETCH_TIMEOUT_MS = 12_000;

/** Browser-originated proxy forwards to the ArchLucid API — allow typical latency but still cap hangs. */
export const PROXY_UPSTREAM_FETCH_TIMEOUT_MS = 60_000;
