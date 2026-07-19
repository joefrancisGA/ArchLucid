import { isDemo } from "@/lib/demo";

export type AdminDeploymentStatusPageServerLoad = {
  readonly demo: boolean;
};

export async function loadAdminDeploymentStatusPageData(): Promise<AdminDeploymentStatusPageServerLoad> {
  return { demo: isDemo() };
}
