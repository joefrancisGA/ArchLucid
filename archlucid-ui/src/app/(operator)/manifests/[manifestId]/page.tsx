import { notFound } from "next/navigation";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
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
}: {
  params: Promise<{ manifestId: string }>;
}) {
  const { manifestId } = await params;

  if (isInvalidManifestRouteId(manifestId)) {
    notFound();
  }

  const result = await loadManifestDetailPageModel(manifestId);

  if (result.kind === "not-found") {
    return (
      <div className="mx-auto max-w-4xl px-1 py-2 sm:px-0">
        <OperatorBrandedNotFound showProcessingHint retryLabel="Retry loading manifest" />
      </div>
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

  return <ManifestDetailPageView model={result.model} />;
}
