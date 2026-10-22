export type GcpConnectionFieldKey = "projectId" | "workloadIdentityPoolProvider" | "serviceAccountEmail";

export type GcpConnectionFieldErrors = {
  readonly projectId: string | null;
  readonly workloadIdentityPoolProvider: string | null;
  readonly serviceAccountEmail: string | null;
};

export function validateGcpConnectionFields(
  projectId: string,
  workloadIdentityPoolProvider: string,
  serviceAccountEmail: string,
): GcpConnectionFieldErrors {
  const trimmedProjectId = projectId.trim();
  const trimmedProvider = workloadIdentityPoolProvider.trim();
  const trimmedServiceAccount = serviceAccountEmail.trim();

  return {
    projectId: trimmedProjectId.length > 0 ? null : "GCP project ID is required.",
    workloadIdentityPoolProvider: trimmedProvider.includes("workloadIdentityPools")
      ? null
      : "Workload Identity Pool provider must reference a workload identity pool provider resource.",
    serviceAccountEmail: trimmedServiceAccount.endsWith(".iam.gserviceaccount.com")
      ? null
      : "Service account email must end with .iam.gserviceaccount.com.",
  };
}

export function fieldErrorMessage(
  fieldErrors: GcpConnectionFieldErrors,
  touched: Readonly<Record<GcpConnectionFieldKey, boolean>>,
  field: GcpConnectionFieldKey,
): string | null {
  if (!touched[field]) {
    return null;
  }

  return fieldErrors[field];
}

export function hasGcpConnectionFieldErrors(fieldErrors: GcpConnectionFieldErrors): boolean {
  return (
    fieldErrors.projectId !== null ||
    fieldErrors.workloadIdentityPoolProvider !== null ||
    fieldErrors.serviceAccountEmail !== null
  );
}
