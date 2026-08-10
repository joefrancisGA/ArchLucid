"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
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
import { sendAdminUserInvitation } from "@/lib/admin-user-invitations";
import { roleDisplayLabel } from "@/lib/role-display-labels";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";

type InviteFormState = {
  email: string;
  role: string;
  message: string;
};

const EMPTY_FORM: InviteFormState = { email: "", role: "", message: "" };

type Props = {
  /**
   * When true, show a non-blocking directory warning above the form.
   * Invite send uses POST /v1/admin/users/invite and must stay available when GET /v1/admin/users is missing.
   */
  readonly directoryUnavailable: boolean;
  readonly onRetry: () => void;
  readonly onInviteSent?: () => void;
};

export function SettingsRolesInvitePanel({ directoryUnavailable, onRetry, onInviteSent }: Props) {
  const [form, setForm] = useState<InviteFormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);

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

    showSuccess(
      result.invitation.acceptUrl
        ? `Invitation sent to ${form.email}. Copy the accept link from Pending invitations if you need to share it manually.`
        : result.invitation.acceptPath
          ? `Invitation sent to ${form.email}. The invitee can open ${result.invitation.acceptPath} to accept.`
          : `Invitation sent to ${form.email}.`,
    );
    setForm(EMPTY_FORM);
    onInviteSent?.();
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
  }

  const canSubmit = form.email.trim().length > 0 && form.role.length > 0;

  return (
    <form
      data-testid="settings-roles-invite-form"
      className="max-w-xl space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
      {directoryUnavailable ? (
        <div data-testid="settings-roles-invite-directory-unavailable" className="space-y-3">
          <OperatorEmptyState
            title="User directory unavailable"
            description="The workspace user list could not be loaded. You can still send invitations; retry the directory if you need to review existing members."
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
              Retry directory
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/internal/health">System health</a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/help/troubleshooting#permissions-or-sign-in-issue">Open troubleshooting</Link>
            </Button>
          </div>
        </div>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="invite-email">Email address</Label>
        <Input
          id="invite-email"
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
        {/* Reviewers are typically assigned Reader (read-only review access) or Auditor (read + audit trail). */}
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
  );
}
