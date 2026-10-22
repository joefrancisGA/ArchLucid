import {
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  type CloudPlatformScope,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";

export function countVisibleCloudProviders(scope: CloudPlatformScope): number {
  return CLOUD_PROVIDER_NEUTRAL_ORDER.filter((providerId) => scope[providerId]).length;
}

export function wouldLeaveNoVisibleCloudProviders(
  scope: CloudPlatformScope,
  providerId: CloudProviderId,
): boolean {
  if (!scope[providerId]) {
    return false;
  }

  return countVisibleCloudProviders(scope) <= 1;
}
