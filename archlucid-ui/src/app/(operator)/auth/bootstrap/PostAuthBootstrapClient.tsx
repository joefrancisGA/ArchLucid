"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AuthBootstrapEvidenceOrientationStrip } from "@/app/(operator)/auth/bootstrap/AuthBootstrapEvidenceOrientationStrip";
import { CreateWorkspaceForm } from "@/app/(operator)/auth/bootstrap/CreateWorkspaceForm";
import { CREATE_WORKSPACE_COPY } from "@/lib/auth/create-workspace-schema";
import type { CreateWorkspaceFormValues } from "@/lib/auth/create-workspace-schema";
import { readInvitationToken } from "@/lib/auth/email-otp-session";
import { resolveBootstrapCompletePath } from "@/lib/auth/email-otp-post-auth";
import {
  acceptPostAuthInvitation,
  createPostAuthWorkspace,
  fetchPostAuthBootstrapStatus,
  initiatePostAuthAccessRequest,
  selectPostAuthWorkspace,
  type PostAuthBootstrapStatusResponse,
} from "@/lib/auth/post-auth-bootstrap-api";
import { isSafeReturnPath, resolveSafeReturnPath } from "@/lib/navigation/safe-return-path";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { persistTokenResponse } from "@/lib/oidc/session";

function applyBootstrapSession(session: {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  redirectPath: string;
}): void {
  persistTokenResponse({
    access_token: session.accessToken,
    token_type: session.tokenType,
    expires_in: session.expiresInSeconds,
  });

  const destination = isSafeReturnPath(session.redirectPath) ? session.redirectPath : "/";
  window.location.replace(destination);
}

export function PostAuthBootstrapClient() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? undefined;
  const safeReturnUrl = useMemo(() => resolveSafeReturnPath(returnUrl, "/"), [returnUrl]);

  const [status, setStatus] = useState<PostAuthBootstrapStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accessRequestSent, setAccessRequestSent] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextStatus = await fetchPostAuthBootstrapStatus(
        safeReturnUrl !== "/" ? safeReturnUrl : undefined,
        readInvitationToken(),
      );
      setStatus(nextStatus);

      if (nextStatus.destination === "Complete") {
        window.location.replace(resolveBootstrapCompletePath(safeReturnUrl));
      }

      if (nextStatus.destination === "ResumeWorkflow" && nextStatus.resumePath) {
        const resume = isSafeReturnPath(nextStatus.resumePath) ? nextStatus.resumePath : "/";
        window.location.replace(resume);
      }
    } catch {
      setErrorMessage("We could not determine your next step. Try signing in again.");
    } finally {
      setLoading(false);
    }
  }, [safeReturnUrl]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleCreateWorkspace = async (values: CreateWorkspaceFormValues) => {
    setPending(true);
    setErrorMessage(null);

    const result = await createPostAuthWorkspace({
      workspaceName: values.workspaceName,
      organizationName: values.organizationName,
      dataRegion: values.dataRegion,
      industryVertical: values.industryVertical,
      industryVerticalOther: values.industryVerticalOther,
      termsAccepted: values.termsAccepted,
      includeDemoSeed: values.includeDemoSeed,
      invitationToken: readInvitationToken(),
    });

    setPending(false);

    if (!result.succeeded || !result.session) {
      setErrorMessage(result.customerMessage ?? "Workspace creation could not be completed.");

      return;
    }

    applyBootstrapSession(result.session);
  };

  const handleAcceptInvitation = async (invitationId: string, confirmEmailMismatch = false) => {
    setPending(true);
    setErrorMessage(null);

    const session = await acceptPostAuthInvitation(
      invitationId,
      readInvitationToken(),
      safeReturnUrl !== "/" ? safeReturnUrl : undefined,
      confirmEmailMismatch,
    );

    setPending(false);

    if (session === null) {
      setErrorMessage("That invitation is no longer available.");

      return;
    }

    applyBootstrapSession(session);
  };

  const handleSelectWorkspace = async (tenantId: string, workspaceId: string) => {
    setPending(true);
    setErrorMessage(null);

    const session = await selectPostAuthWorkspace(
      tenantId,
      workspaceId,
      safeReturnUrl !== "/" ? safeReturnUrl : undefined,
    );

    setPending(false);

    if (session === null) {
      setErrorMessage("That workspace is not available.");

      return;
    }

    applyBootstrapSession(session);
  };

  const handleAccessRequest = async () => {
    setPending(true);
    const ok = await initiatePostAuthAccessRequest();
    setPending(false);

    if (ok) {
      setAccessRequestSent(true);
    }
  };

  if (loading || status === null) {
    return (
      <div className="max-w-[560px]">
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role="status">
          Preparing your ArchLucid workspace…
        </p>
      </div>
    );
  }

  if (status.destination === "AcceptInvitation") {
    return (
      <>
        <div className="max-w-[560px]" data-testid="bootstrap-invitation-step">
          <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{CREATE_WORKSPACE_COPY.invitationTitle}</h1>
          <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {CREATE_WORKSPACE_COPY.invitationLead}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {status.pendingInvitations.map((invitation) => (
              <div key={invitation.invitationId} className="space-y-2 rounded-md border border-al-border p-3">
                {invitation.maskedInvitedEmail ? (
                  <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    Invited: {invitation.maskedInvitedEmail}
                  </p>
                ) : null}
                {invitation.requiresEmailMismatchConfirmation && invitation.confirmationMessage ? (
                  <p className={cn("m-0 text-sm text-amber-800 dark:text-amber-300", OPERATOR_TYPOGRAPHY.body)}>
                    {invitation.confirmationMessage}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="primary"
                  disabled={pending}
                  data-testid={`bootstrap-accept-invitation-${invitation.invitationId}`}
                  onClick={() => {
                    void handleAcceptInvitation(
                      invitation.invitationId,
                      invitation.requiresEmailMismatchConfirmation === true,
                    );
                  }}
                >
                  {invitation.requiresEmailMismatchConfirmation ? "Confirm and join" : `Join ${invitation.label}`}
                </Button>
              </div>
            ))}
          </div>
          {errorMessage ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <AuthBootstrapEvidenceOrientationStrip />
      </>
    );
  }

  if (status.destination === "SelectWorkspace") {
    return (
      <>
        <div className="max-w-[560px]" data-testid="bootstrap-select-workspace-step">
          <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{CREATE_WORKSPACE_COPY.selectWorkspaceTitle}</h1>
          <div className="mt-6 flex flex-col gap-3">
            {status.workspaces.map((workspace) => (
              <Button
                key={`${workspace.tenantId}:${workspace.workspaceId}`}
                type="button"
                variant="outline"
                className="w-full justify-start"
                disabled={pending}
                data-testid={`bootstrap-select-workspace-${workspace.workspaceId}`}
                onClick={() => {
                  void handleSelectWorkspace(workspace.tenantId, workspace.workspaceId);
                }}
              >
                {workspace.workspaceName}
              </Button>
            ))}
          </div>
          {errorMessage ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <AuthBootstrapEvidenceOrientationStrip />
      </>
    );
  }

  if (status.destination === "CreateWorkspace" && status.canCreateWorkspace) {
    return (
      <>
        <CreateWorkspaceForm
          pending={pending}
          errorMessage={errorMessage}
          showAccessRequest={status.duplicateOrganization?.accessRequestRecommended === true}
          onSubmit={(values) => {
            void handleCreateWorkspace(values);
          }}
          onAccessRequest={() => {
            void handleAccessRequest();
          }}
        />
        <AuthBootstrapEvidenceOrientationStrip />
      </>
    );
  }

  return (
    <>
      <div className="max-w-[560px]" data-testid="bootstrap-no-access-step">
        <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{CREATE_WORKSPACE_COPY.noAccessTitle}</h1>
        <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {status.denialReason ?? "Sign-in succeeded, but no workspace is available for this account."}
        </p>
        {accessRequestSent ? (
          <p role="status" className="mt-3 text-sm text-al-text-secondary">
            Your access request was recorded. Your administrator will follow up if appropriate.
          </p>
        ) : (
          <Button type="button" variant="outline" className="mt-4" disabled={pending} onClick={() => void handleAccessRequest()}>
            {CREATE_WORKSPACE_COPY.accessRequest}
          </Button>
        )}
      </div>
      <AuthBootstrapEvidenceOrientationStrip />
    </>
  );
}
