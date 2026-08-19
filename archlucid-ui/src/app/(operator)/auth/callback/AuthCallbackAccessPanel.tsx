"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION,
  AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR,
  AUTH_CALLBACK_ACCESS_HEADING,
  AUTH_CALLBACK_ACCESS_LEAD,
  AUTH_CALLBACK_ACCESS_REQUEST_ACTION,
  AUTH_CALLBACK_ACCESS_SUBMIT_ERROR,
  AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL,
  AUTH_CALLBACK_ACCESS_SUCCESS_BODY,
  AUTH_CALLBACK_ACCESS_SUCCESS_TITLE,
  AUTH_CALLBACK_ACCESS_TRY_AGAIN_ACTION,
} from "@/lib/auth/access-request-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AuthCallbackAccessPanelProps = {
  readonly technicalDetail: string;
};

type FormState = {
  readonly name: string;
  readonly workEmail: string;
  readonly company: string;
  readonly roleTitle: string;
  readonly cloudPlatformFocus: string;
  readonly note: string;
  readonly websiteUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  workEmail: "",
  company: "",
  roleTitle: "",
  cloudPlatformFocus: "",
  note: "",
  websiteUrl: "",
};

/** Private-beta access request experience for `/auth/callback` sign-in failures. */
export function AuthCallbackAccessPanel({ technicalDetail }: AuthCallbackAccessPanelProps): React.JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          workEmail: form.workEmail,
          company: form.company,
          roleTitle: form.roleTitle,
          cloudPlatformFocus: form.cloudPlatformFocus.trim() === "" ? null : form.cloudPlatformFocus.trim(),
          note: form.note.trim() === "" ? null : form.note.trim(),
          websiteUrl: form.websiteUrl,
        }),
      });

      if (response.status === 409) {
        setErrorMessage(AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR);
        return;
      }

      if (!response.ok) {
        setErrorMessage(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR);
        return;
      }

      setSubmitted(true);
      setShowForm(false);
    } catch {
      setErrorMessage(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-[560px]" data-testid="auth-callback-access-success">
        <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_CALLBACK_ACCESS_SUCCESS_TITLE}</h1>
        <p className={cn("mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{AUTH_CALLBACK_ACCESS_SUCCESS_BODY}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/signin">{AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[560px]" data-testid="auth-callback-access-panel">
      <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>{AUTH_CALLBACK_ACCESS_HEADING}</h1>
      <p className={cn("mt-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{AUTH_CALLBACK_ACCESS_LEAD}</p>
      <p
        className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="auth-callback-technical-detail"
      >
        {technicalDetail}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="auth-callback-request-access"
          onClick={() => {
            setShowForm((open) => !open);
          }}
        >
          {AUTH_CALLBACK_ACCESS_REQUEST_ACTION}
        </Button>
        <Button asChild variant="outline" size="sm" data-testid="auth-callback-try-again">
          <Link href="/auth/signin">{AUTH_CALLBACK_ACCESS_TRY_AGAIN_ACTION}</Link>
        </Button>
      </div>

      {showForm ? (
        <form
          className="mt-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
          data-testid="auth-callback-access-form"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="access-request-name">Name</Label>
            <Input
              id="access-request-name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={(event) => {
                setForm((current) => ({ ...current, name: event.target.value }));
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-request-work-email">Work email</Label>
            <Input
              id="access-request-work-email"
              name="workEmail"
              type="email"
              autoComplete="email"
              required
              value={form.workEmail}
              onChange={(event) => {
                setForm((current) => ({ ...current, workEmail: event.target.value }));
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-request-company">Company</Label>
            <Input
              id="access-request-company"
              name="company"
              autoComplete="organization"
              required
              value={form.company}
              onChange={(event) => {
                setForm((current) => ({ ...current, company: event.target.value }));
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-request-role">Role / title</Label>
            <Input
              id="access-request-role"
              name="roleTitle"
              autoComplete="organization-title"
              required
              value={form.roleTitle}
              onChange={(event) => {
                setForm((current) => ({ ...current, roleTitle: event.target.value }));
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-request-cloud-focus">Cloud / platform focus (optional)</Label>
            <Input
              id="access-request-cloud-focus"
              name="cloudPlatformFocus"
              value={form.cloudPlatformFocus}
              onChange={(event) => {
                setForm((current) => ({ ...current, cloudPlatformFocus: event.target.value }));
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="access-request-note">Brief note (optional)</Label>
            <textarea
              id="access-request-note"
              name="note"
              rows={3}
              className={cn(
                "min-h-[5rem] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-al-text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:border-neutral-700 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={form.note}
              onChange={(event) => {
                setForm((current) => ({ ...current, note: event.target.value }));
              }}
            />
          </div>

          <div className="hidden" aria-hidden="true">
            <Label htmlFor="access-request-website">Website</Label>
            <Input
              id="access-request-website"
              name="websiteUrl"
              tabIndex={-1}
              autoComplete="off"
              value={form.websiteUrl}
              onChange={(event) => {
                setForm((current) => ({ ...current, websiteUrl: event.target.value }));
              }}
            />
          </div>

          {errorMessage !== null ? (
            <p className={cn("m-0 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL : "Submit request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => {
                setShowForm(false);
                setErrorMessage(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
