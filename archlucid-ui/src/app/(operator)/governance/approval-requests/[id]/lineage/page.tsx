import { GovernanceApprovalLineagePageClient } from "./_sections/GovernanceApprovalLineagePageClient";
import { loadGovernanceApprovalLineagePageData } from "./_sections/load-governance-approval-lineage-page-data";

export default async function GovernanceApprovalLineagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadGovernanceApprovalLineagePageData(id);

  return <GovernanceApprovalLineagePageClient key={id} loaded={loaded} />;
}
