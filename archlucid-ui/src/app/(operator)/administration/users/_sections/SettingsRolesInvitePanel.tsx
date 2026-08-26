"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, type RefObject } from "react";

import { MutatingInWorkspaceChip } from "@/components/MutatingInWorkspaceChip";
import { ColdInviteUsersInviteVocabularyRail } from "@/components/ColdInviteUsersInviteVocabularyRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  sendAdminUserInvitation,
  type AdminUserInvitationRow,
} from "@/lib/admin-user-invitations";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_PACKAGE_LABEL } from "@/lib/usability/canonical-product-terms";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  resolveInviteReviewerEmphasizedStepId,
  resolveInviteReviewerSteps,
} from "@/lib/invite-reviewer-checklist";

import { resolveAdminUserInvitationAcceptLink } from "./settings-roles-pending-invitations";
import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";

type InviteFormState = {
  email: string;
  role: string;
  message: string;
};

const EMPTY_FORM: InviteFormState = { email: "", role: "", message: "" };

type Props = {
  readonly emailInputRef?: RefObject<HTMLInputElement | null>;
  readonly onInviteSent?: (invitation: AdminUserInvitationRow) => void;
  readonly initialMessage?: string;
  readonly reviewId?: string;
};

export function SettingsRolesInvitePanel({ emailInputRef, onInviteSent, initialMessage, reviewId }: Props) {
  const [form, setForm] = useState<InviteFormState>(() => ({
    ...EMPTY_FORM,
    message: initialMessage?.trim() ?? "",
  }));
  const [sending, setSending] = useState(false);
  const [inviteSentForReviewId, setInviteSentForReviewId] = useState<string | null>(null);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const reviewIdTrimmed = reviewId?.trim() ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.email.trim() || !form.role) {
      return;
    }

    setSending(true);

    const result = await sendAdminUserInvitation(form.email.trim(), form.role, form.message);

    setSending(false);

    if (!result.ok) {
      showError(
        "Could not send invite",
        "The invitation service rejected the request or is unavailable. Check the email and try again.",
      );

      return;
    }

    const acceptLink = resolveAdminUserInvitationAcceptLink(result.invitation);

    showSuccess(
      acceptLink !== null
        ? `Invitation sent to ${form.email}. Copy the accept link from Pending invitations if you need to share it manually.`
        : `Invitation sent to ${form.email}.`,
    );
    setForm(EMPTY_FORM);
    if (reviewIdTrimmed.length > 0) {
      setInviteSentForReviewId(reviewIdTrimmed);
    }
    onInviteSent?.(result.invitation);
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
  }

  const canSubmit = form.email.trim().length > 0 && form.role.length > 0;
  const inviteReviewerSteps = resolveInviteReviewerSteps({
    emailConfigured: form.email.trim().length > 0,
    roleSelected: form.role.length > 0,
    inviteSent: inviteSentForReviewId !== null,
  });
  const inviteReviewerEmphasizedStepId = resolveInviteReviewerEmphasizedStepId({
    emailConfigured: form.email.trim().length > 0,
    roleSelected: form.role.length > 0,
    inviteSent: inviteSentForReviewId !== null,
  });

  return (
    <>
      {inviteSentForReviewId !== null ? (
        <div
          className="mb-4 rounded-md border border-teal-200 bg-teal-50 px-3 py-3 dark:border-teal-900 dark:bg-teal-950/40"
          data-testid="settings-roles-invite-review-handoff"
          role="status"
        >
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Invitation sent. Return to the {REVIEW_PACKAGE_LABEL.toLowerCase()} when you are ready to share context with the reviewer.
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" asChild>
            <Link href={reviewDetailPath(inviteSentForReviewId)} data-testid="settings-roles-invite-back-to-review-package">
              Back to {REVIEW_PACKAGE_LABEL.toLowerCase()}
            </Link>
          </Button>
        </div>
      ) : null}
    <form
      data-testid="settings-roles-invite-form"
      className="max-w-xl space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      {buyerPolishedShell ? null : (
        <ColdInviteUsersInviteVocabularyRail currentSurfaceId="users-invite" />
      )}
      <IntegrationConnectChecklist
        title="Invite checklist"
        steps={inviteReviewerSteps}
        emphasizedStepId={inviteReviewerEmphasizedStepId}
        testIdPrefix="invite-reviewer"
      />
      <div className="space-y-1">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
          ref={emailInputRef}
          type="email"
          placeholder="reviewer@example.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          autoComplete="email"
          data-testid="settings-roles-invite-email"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="invite-role">Role</Label>
        <Select
          value={form.role}
          onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
        >
          <SelectTrigger
            id="invite-role"
            className="w-[12rem]"
            data-testid="settings-roles-invite-role"
          >
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {SETTINGS_ROLES_ASSIGNABLE.map((role) => (
              <SelectItem key={role} value={role}>
                {roleDisplayLabel(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Reviewers are usually assigned the <strong>Reader</strong> or <strong>Auditor</strong> role.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="invite-message">
          Message <span className={cn("font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>(optional)</span>
        </Label>
        <Textarea
          id="invite-message"
          placeholder="Add a note to include in the invitation email…"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          rows={3}
          data-testid="settings-roles-invite-message"
        />
      </div>

      <div className="space-y-2">
        <MutatingInWorkspaceChip />
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={sending || !canSubmit}
            data-testid="settings-roles-invite-submit"
          >
            {sending ? "Sending…" : "Send invite"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sending}
            onClick={handleCancel}
            data-testid="settings-roles-invite-clear"
          >
            Clear
          </Button>
        </div>
        {!canSubmit && !sending ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="settings-roles-invite-readiness">
            Enter an email address and choose a role to send an invitation.
          </p>
        ) : null}
      </div>
    </form>
    </>
  );
}

