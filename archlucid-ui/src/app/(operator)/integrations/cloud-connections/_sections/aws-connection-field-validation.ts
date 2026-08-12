export type AwsConnectionFieldKey = "accountId" | "region" | "roleArn";

export type AwsConnectionFieldErrors = {
  readonly accountId: string | null;
  readonly region: string | null;
  readonly roleArn: string | null;
};

export function validateAwsConnectionFields(
  accountId: string,
  region: string,
  roleArn: string,
): AwsConnectionFieldErrors {
  const trimmedAccountId = accountId.trim();
  const trimmedRegion = region.trim();
  const trimmedRoleArn = roleArn.trim();

  return {
    accountId: /^\d{12}$/.test(trimmedAccountId) ? null : "AWS account ID must be a 12-digit number.",
    region: trimmedRegion.length > 0 ? null : "AWS region is required.",
    roleArn: trimmedRoleArn.startsWith("arn:aws:iam:") ? null : "Role ARN must start with arn:aws:iam:.",
  };
}

export function fieldErrorMessage(
  fieldErrors: AwsConnectionFieldErrors,
  touched: Readonly<Record<AwsConnectionFieldKey, boolean>>,
  field: AwsConnectionFieldKey,
): string | null {
  if (!touched[field]) {
    return null;
  }

  return fieldErrors[field];
}

export function hasAwsConnectionFieldErrors(fieldErrors: AwsConnectionFieldErrors): boolean {
  return fieldErrors.accountId !== null || fieldErrors.region !== null || fieldErrors.roleArn !== null;
}
