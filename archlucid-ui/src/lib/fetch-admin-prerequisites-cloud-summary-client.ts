import { proxyJsonGet } from "@/lib/proxy-json-client";

export type AdminPrerequisitesCloudConnectionsSummary = {
  readonly anyConfigured: boolean;
};

export async function fetchAdminPrerequisitesCloudConnectionsSummary(): Promise<AdminPrerequisitesCloudConnectionsSummary> {
  return proxyJsonGet<AdminPrerequisitesCloudConnectionsSummary>(
    "/api/proxy/v1/admin/prerequisites/cloud-connections-summary",
    { cache: "no-store" },
  );
}
