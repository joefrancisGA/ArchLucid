import { AdvisoryHubClient } from "@/components/advisory/AdvisoryHubClient";
import { advisoryHubTabFromSearchParam } from "@/lib/advisory-hub-tab";
import { scopedRunIdFromQuery } from "@/lib/architecture/architecture-risk-register-page";

type PageProps = {
  searchParams: Promise<{ tab?: string; runId?: string }>;
};

/**
 * Canonical Advisory scans hub under Governance (TB-1124).
 * Server resolves `?tab=` / `?runId=` so the client hub mounts without a long Suspense wait on `useSearchParams`.
 */
export default async function GovernanceAdvisoryScansPage(props: PageProps) {
  const p = await props.searchParams;
  const initialTab = advisoryHubTabFromSearchParam(p.tab ?? null);
  const initialRunId = scopedRunIdFromQuery(p.runId ?? null);

  return <AdvisoryHubClient initialTab={initialTab} initialRunId={initialRunId} />;
}
