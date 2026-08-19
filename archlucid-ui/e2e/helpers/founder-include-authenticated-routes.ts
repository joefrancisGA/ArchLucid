import {
  isLoopbackAcceptanceTarget,
  resolveAcceptanceBaseUrl,
  resolveAcceptanceStorageState,
} from "./acceptance-base-url";

/**
 * Authenticated founder routes need storageState, explicit opt-in, or a loopback live shell.
 * Set FOUNDER_PUBLIC_ONLY=1 to force public marketing routes only.
 */
export function shouldIncludeFounderAuthenticatedRoutes(): boolean {
  if (process.env.FOUNDER_PUBLIC_ONLY === "1") {
    return false;
  }

  if (resolveAcceptanceStorageState()) {
    return true;
  }

  if (process.env.FOUNDER_INCLUDE_AUTH_ROUTES === "1") {
    return true;
  }

  return isLoopbackAcceptanceTarget(resolveAcceptanceBaseUrl());
}
