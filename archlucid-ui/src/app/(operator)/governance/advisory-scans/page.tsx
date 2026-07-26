import { AdvisoryHubClient } from "@/components/advisory/AdvisoryHubClient";
import { advisoryHubTabFromSearchParam } from "@/lib/advisory-hub-tab";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

/**
 * Canonical Advisory scans hub under Governance (TB-1124).
 * Server resolves `?tab=` so the client hub mounts without a long Suspense wait on `useSearchParams`.
 */
export default async function GovernanceAdvisoryScansPage(props: PageProps) {
  const p = await props.searchParams;
  const initialTab = advisoryHubTabFromSearchParam(p.tab ?? null);

  return <AdvisoryHubClient initialTab={initialTab} />;
}
