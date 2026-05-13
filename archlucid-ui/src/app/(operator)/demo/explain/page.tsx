import { DemoExplainPageClient } from "./_sections/DemoExplainPageClient";
import { loadDemoExplainPageData } from "./_sections/load-demo-explain-page-data";

/**
 * Public, read-only proof route. Renders the **provenance graph** and the **citations-bound aggregate
 * explanation** for the latest committed demo-seed run, side-by-side. Source:
 * `GET /v1/demo/explain` — server-side `DemoReadModelClient` which composes the same application services
 * as `/v1/explain` and `/v1/provenance` but is hard-pinned to the demo tenant scope.
 *
 * The route is gated on `Demo:Enabled=true` at the API; a 404 here covers both
 * "demo seed has not been applied" and "this deployment never exposes the demo surface".
 */
export default async function DemoExplainPage() {
  const loaded = await loadDemoExplainPageData();

  return <DemoExplainPageClient loaded={loaded} />;
}
