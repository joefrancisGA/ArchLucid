import type { QuickScanStatusResponse } from "./quick-scan-types";

const DEFAULT_CAPACITY_MESSAGE =
  "Quick Scan has reached its demonstration capacity for today.";

export function resolveQuickScanCapacityMessage(status: QuickScanStatusResponse | null): string | null {
  if (status === null) {
    return null;
  }

  if (status.capacityStateMessage && status.capacityStateMessage.trim().length > 0) {
    return status.capacityStateMessage;
  }

  if (status.publicMessage && status.publicMessage.trim().length > 0) {
    return status.publicMessage;
  }

  if (status.capacityState === "Available") {
    return null;
  }

  if (status.capacityState === "SampleOnly") {
    return "Quick Scan is in sample-only mode. View the illustrative sample below.";
  }

  if (status.capacityState === "VerificationRequired") {
    return "Additional Quick Scan attempts require sign-in.";
  }

  if (status.capacityState === "Busy") {
    return "Quick Scan is busy right now. View the sample result or try again in a moment.";
  }

  if (status.capacityState === "AnonymousLimit") {
    return "You have reached the anonymous Quick Scan limit. View the sample result or sign in for more.";
  }

  if (!status.capacityAvailable || !status.enabled) {
    return DEFAULT_CAPACITY_MESSAGE;
  }

  return null;
}

export function shouldOfferQuickScanSample(status: QuickScanStatusResponse | null): boolean {
  if (status === null) {
    return true;
  }

  return status.sampleResultAvailable;
}

export function isQuickScanAiSubmitAllowed(status: QuickScanStatusResponse | null): boolean {
  if (status === null) {
    return true;
  }

  if (status.capacityState !== undefined && status.capacityState !== "Available") {
    return false;
  }

  return status.enabled && status.capacityAvailable;
}
