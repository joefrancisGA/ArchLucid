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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { SETTINGS_ROLES_ASSIGNABLE } from "./settings-roles-page-constants";

type InviteFormState = {
  email: string;
  role: string;
  message: string;
};

const EMPTY_FORM: InviteFormState = { email: "", role: "", message: "" };

/**
 * Submits an invite via the admin API. Returns whether the API persisted the
 * invite, accepted a preview-only path (missing endpoint), or failed.
 */
async function requestSendInvite(
  email: string,
  role: string,
  message: string,
): Promise<"sent" | "preview" | "failed"> {
  try {
    const res = await fetch(
      "/api/proxy/v1/admin/users/invite",
      mergeRegistrationScopeForProxy({
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ email, appRole: role, message: message || undefined }),
      }),
    );

    if (res.ok) {
      return "sent";
    }

    if (res.status === 404 || res.status === 405 || res.status === 501) {
      return "preview";
    }

    return "failed";
  } catch {
    return "failed";
  }
}

type Props = {
  /** When true, show the directory-unavailable error state instead of the form. */
  readonly directoryUnavailable: boolean;
  readonly onRetry: () => void;
};

export function SettingsRolesInvitePanel({ directoryUnavailable, onRetry }: Props) {
  const [form, setForm] = useState<InviteFormState>(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  if (directoryUnavailable) {
    return (
      <div data-testid="settings-roles-invite-directory-unavailable">
        <OperatorEmptyState
          title="Invitations unavailable"
          description="ArchLucid could not load the user directory for this workspace. You can still review role permissions, but invitations cannot be sent until the directory is available."
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <a href="/admin/health">System health</a>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href="/help/troubleshooting">Open troubleshooting</Link>
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.email.trim() || !form.role) {
      return;
    }

    setSending(true);

    const outcome = await requestSendInvite(form.email.trim(), form.role, form.message);

    setSending(false);

    if (outcome === "sent") {
      showSuccess(`Invite sent to ${form.email}.`);
      setForm(EMPTY_FORM);

      return;
    }

    if (outcome === "preview") {
      showSuccess(`Invite recorded in the UI for ${form.email}. The invite API is not available on this environment yet.`);
      setForm(EMPTY_FORM);

      return;
    }

    showError("Could not send invite", "The server rejected the invitation. Check the email and try again.");
  }

  function handleCancel() {
    setForm(EMPTY_FORM);
  }

  return (
    <form
      data-testid="settings-roles-invite-form"
      className="space-y-4"
      onSubmit={(event) => void handleSubmit(event)}
    >
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
                {role}
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

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={sending || !form.email.trim() || !form.role}
          data-testid="settings-roles-invite-submit"
        >
          {sending ? "Sending…" : "Send invite"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={sending}
          onClick={handleCancel}
          data-testid="settings-roles-invite-cancel"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
