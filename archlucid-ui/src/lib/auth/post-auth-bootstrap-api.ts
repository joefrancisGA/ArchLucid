export type PostAuthBootstrapDestination =
  | "AcceptInvitation"
  | "SelectWorkspace"
  | "ResumeWorkflow"
  | "CreateWorkspace"
  | "NoAccess"
  | "Complete";

export type PostAuthBootstrapStatusResponse = {
  destination: PostAuthBootstrapDestination;
  pendingInvitations: ReadonlyArray<{
    invitationId: string;
    label: string;
    maskedInvitedEmail?: string | null;
    requiresEmailMismatchConfirmation?: boolean;
    confirmationMessage?: string | null;
  }>;
  workspaces: ReadonlyArray<{ tenantId: string; workspaceId: string; workspaceName: string }>;
  resumePath?: string | null;
  duplicateOrganization?: {
    detected: boolean;
    accessRequestRecommended: boolean;
    customerMessage: string;
  } | null;
  canCreateWorkspace: boolean;
  denialReason?: string | null;
};

export type PostAuthBootstrapSessionResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  redirectPath: string;
};

export type PostAuthCreateWorkspaceBody = {
  workspaceName: string;
  organizationName: string;
  dataRegion?: string;
  industryVertical?: string;
  industryVerticalOther?: string;
  termsAccepted: boolean;
  includeDemoSeed: boolean;
  invitationToken?: string | null;
};

export async function fetchPostAuthBootstrapStatus(
  returnUrl?: string,
  invitationToken?: string | null,
): Promise<PostAuthBootstrapStatusResponse> {
  const params = new URLSearchParams();

  if (returnUrl) {
    params.set("returnUrl", returnUrl);
  }

  if (invitationToken) {
    params.set("invitationToken", invitationToken);
  }

  const query = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetch(`/api/proxy/v1/auth/bootstrap/status${query}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("bootstrap_status_failed");
  }

  const payload = (await response.json()) as PostAuthBootstrapStatusResponse;

  return payload;
}

export async function createPostAuthWorkspace(
  body: PostAuthCreateWorkspaceBody,
): Promise<{
  succeeded: boolean;
  customerMessage?: string | null;
  onboardingPath?: string | null;
  session?: PostAuthBootstrapSessionResponse | null;
  duplicateOrganization?: PostAuthBootstrapStatusResponse["duplicateOrganization"];
}> {
  const response = await fetch("/api/proxy/v1/auth/bootstrap/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return { succeeded: false, customerMessage: "Workspace creation could not be completed." };
  }

  return (await response.json()) as {
    succeeded: boolean;
    customerMessage?: string | null;
    onboardingPath?: string | null;
    session?: PostAuthBootstrapSessionResponse | null;
    duplicateOrganization?: PostAuthBootstrapStatusResponse["duplicateOrganization"];
  };
}

export async function acceptPostAuthInvitation(
  invitationId: string,
  invitationToken: string | null,
  returnUrl?: string,
  confirmEmailMismatch = false,
): Promise<PostAuthBootstrapSessionResponse | null> {
  const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "";
  const response = await fetch(`/api/proxy/v1/auth/bootstrap/invitations/accept${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ invitationId, invitationToken, confirmEmailMismatch }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PostAuthBootstrapSessionResponse;
}

export async function selectPostAuthWorkspace(
  tenantId: string,
  workspaceId: string,
  returnUrl?: string,
): Promise<PostAuthBootstrapSessionResponse | null> {
  const query = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "";
  const response = await fetch(`/api/proxy/v1/auth/bootstrap/workspaces/select${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tenantId, workspaceId }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as PostAuthBootstrapSessionResponse;
}

export async function initiatePostAuthAccessRequest(message?: string): Promise<boolean> {
  const response = await fetch("/api/proxy/v1/auth/bootstrap/access-request", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message }),
  });

  return response.status === 202;
}
