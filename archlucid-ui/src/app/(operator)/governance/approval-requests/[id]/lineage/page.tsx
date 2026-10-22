import { GovernanceApprovalLineagePageClient } from "./_sections/GovernanceApprovalLineagePageClient";
import { loadGovernanceApprovalLineagePageData } from "./_sections/load-governance-approval-lineage-page-data";

export default async function GovernanceApprovalLineagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ runId?: string }>;
}) {
  const { id } = await params;
  const { runId: findingsQueueRunId } = await searchParams;
  const loaded = await loadGovernanceApprovalLineagePageData(id);

  return (
    <GovernanceApprovalLineagePageClient
      key={id}
      loaded={loaded}
      findingsQueueRunId={findingsQueueRunId ?? null}
    />
  );
}
