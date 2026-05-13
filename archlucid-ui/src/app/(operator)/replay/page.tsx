import { ReplayPageClient } from "./_sections/ReplayPageClient";
import { loadReplayPageData } from "./_sections/load-replay-page-data";

/** Replay page entry: server chooses demo shell vs live path; live branch wraps URL-hydrated form in `Suspense`. */
export default async function ReplayPage() {
  const loaded = await loadReplayPageData();

  return <ReplayPageClient loaded={loaded} />;
}
