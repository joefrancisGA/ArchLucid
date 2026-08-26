import { notFound } from "next/navigation";

import { OperatorBrandedNotFound } from "@/components/operator/OperatorBrandedNotFound";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { resolveManifestDetailSectionTab } from "@/lib/manifest-detail-section-tabs";
import { isInvalidManifestRouteId } from "@/lib/route-dynamic-param";

import { loadManifestDetailPageModel } from "./_sections/load-manifest-detail-page-model";
import {
  ManifestDetailSummaryLoadErrorView,
  ManifestDetailSummaryMalformedView,
  ManifestDetailSummaryMissingView,
} from "./_sections/ManifestDetailPageErrorViews";
import { ManifestDetailPageView } from "./_sections/ManifestDetailPageView";

/** Server manifest detail route: validates id, loads model, renders view or error states. */
export default async function ManifestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ manifestId: string }>;
  searchParams: Promise<{ tab?: string; runId?: string }>;
}) {
  const { manifestId } = await params;
  const { tab, runId } = await searchParams;
  const initialTab = resolveManifestDetailSectionTab(tab ?? null);
  const listScopedRunId = (runId ?? "").trim();

  if (isInvalidManifestRouteId(manifestId)) {
    notFound();
  }

  const result = await loadManifestDetailPageModel(manifestId);

  if (result.kind === "not-found") {
    return (
      <OperatorPageContainer variant="dashboard" className="px-1 py-2 sm:px-0">
        <OperatorBrandedNotFound showProcessingHint retryLabel="Retry loading review record" />
      </OperatorPageContainer>
    );
  }

  if (result.kind === "summary-error") {
    return (
      <ManifestDetailSummaryLoadErrorView
        buyerPolishedLayout={result.buyerPolishedLayout}
        summaryFailure={result.summaryFailure}
      />
    );
  }

  if (result.kind === "summary-malformed") {
    return (
      <ManifestDetailSummaryMalformedView
        buyerPolishedLayout={result.buyerPolishedLayout}
        message={result.message}
      />
    );
  }

  if (result.kind === "summary-missing") {
    return <ManifestDetailSummaryMissingView buyerPolishedLayout={result.buyerPolishedLayout} />;
  }

  return (
    <ManifestDetailPageView
      model={result.model}
      initialTab={initialTab}
      listScopedRunId={listScopedRunId.length > 0 ? listScopedRunId : null}
    />
  );
}
