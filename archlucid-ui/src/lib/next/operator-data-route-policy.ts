/**
 * Opt authenticated product routes into request-time rendering when they load live tenant data.
 * Client-heavy routes (for example Ask) may omit these exports and rely on client fetches.
 *
 * Stable operator surfaces (for example `/help`) inherit default caching from the
 * shell layout and may prerender when their loaders are static.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
