import { apiDelete, apiGet, apiPostJson } from "@/lib/api/http";
import type {
  OperatorSavedView,
  OperatorSavedViewListResponse,
  OperatorSavedViewPayload,
  OperatorSavedViewSurface,
} from "@/lib/operator-saved-view-types";

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
  return apiPostJson<OperatorSavedView>("/v1/operator/saved-views", request);
}

export async function deleteOperatorSavedView(viewId: string): Promise<void> {
  await apiDelete(`/v1/operator/saved-views/${encodeURIComponent(viewId)}`);
}
