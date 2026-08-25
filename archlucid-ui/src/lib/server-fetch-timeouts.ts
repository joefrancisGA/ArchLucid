/**
 * Bounded server-side fetch durations so Next.js SSG/RSC and the API proxy cannot hang indefinitely
 * when a host accepts TCP but never completes a response.
 */

/** Marketing/demo preview calls (build-time prerender, public demo hosts). */
export const MARKETING_UPSTREAM_FETCH_TIMEOUT_MS = 12_000;

/** Browser-originated proxy forwards to the ArchLucid API — allow typical latency but still cap hangs. */
export const PROXY_UPSTREAM_FETCH_TIMEOUT_MS = 60_000;

/**
 * LLM advisory intake (structured-brief suggest, overview rewrite, suggestion explain).
 * Multiple sequential completion calls can exceed the default 60s proxy budget on long overviews.
 */
export const PROXY_UPSTREAM_LLM_ADVISORY_FETCH_TIMEOUT_MS = 180_000;

/**
 * Development catalog reset (drop/create + migrations + bootstrap) through the UI BFF.
 * SQL catalog work can run several minutes on a locked local instance.
 */
export const PROXY_UPSTREAM_CATALOG_RESET_FETCH_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Multipart / large evidence uploads through the UI proxy — allow slow links up to the 100 MB envelope.
 * Keep well above {@link PROXY_UPSTREAM_FETCH_TIMEOUT_MS} so JSON calls stay snappy-fail.
 */
export const PROXY_UPSTREAM_UPLOAD_FETCH_TIMEOUT_MS = 10 * 60 * 1000;

/** Server components and RSC loaders calling the API directly — cap hangs before the platform kills the route. */
export const SERVER_UPSTREAM_FETCH_TIMEOUT_MS = 45_000;
