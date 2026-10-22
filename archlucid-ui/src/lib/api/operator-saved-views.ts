import { apiDelete, apiGet, apiPostJson } from "@/lib/api/http";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { operatorSavedViewMutationBlockedReason } from "@/lib/operator/operator-saved-view-mutation-blocked-reason";
import type {
  OperatorSavedView,
  OperatorSavedViewListResponse,
  OperatorSavedViewPayload,
  OperatorSavedViewSurface,
} from "@/lib/operator/operator-saved-view-types";

export type { OperatorSavedView, OperatorSavedViewPayload, OperatorSavedViewSurface };

export type CreateOperatorSavedViewRequest = {
  surface: OperatorSavedViewSurface;
  name: string;
  payload: OperatorSavedViewPayload;
  isShared?: boolean;
};

export async function listOperatorSavedViews(
  surface?: OperatorSavedViewSurface,
): Promise<OperatorSavedView[]> {
  const query = surface !== undefined ? `?surface=${encodeURIComponent(surface)}` : "";
  const response = await apiGet<OperatorSavedViewListResponse>(`/v1/operator/saved-views${query}`);

  return response.views ?? [];
}

export async function createOperatorSavedView(
  request: CreateOperatorSavedViewRequest,
): Promise<OperatorSavedView> {
  try {
    return await apiPostJson<OperatorSavedView>("/v1/operator/saved-views", request);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = operatorSavedViewMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function deleteOperatorSavedView(viewId: string): Promise<void> {
  await apiDelete(`/v1/operator/saved-views/${encodeURIComponent(viewId)}`);
}
