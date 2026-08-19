import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type AdminPrerequisitesCloudConnectionsSummary = {
  readonly anyConfigured: boolean;
};

export async function fetchAdminPrerequisitesCloudConnectionsSummary(): Promise<AdminPrerequisitesCloudConnectionsSummary> {
  const response = await fetch("/api/proxy/v1/admin/prerequisites/cloud-connections-summary", {
    ...mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
  });

  if (!response.ok) {
    throw Object.assign(new Error("Cloud connections summary unavailable"), { status: response.status });
  }

  return (await response.json()) as AdminPrerequisitesCloudConnectionsSummary;
}
