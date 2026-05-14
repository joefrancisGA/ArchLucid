import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

/** Admin user directory stays client-fetched; server aligns demo routing without prefetching privileged listings. */
export type AdminUsersPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminUsersPageData(): Promise<AdminUsersPageServerLoad> {
  const demo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  return { demo };
}
