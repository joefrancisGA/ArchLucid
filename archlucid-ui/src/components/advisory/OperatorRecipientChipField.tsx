"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { OperatorRecipientValidationResult } from "@/components/advisory/useOperatorRecipientDraft";

export type OperatorRecipientChipFieldProps = {
  readonly idPrefix: string;
  readonly label: string;
  readonly canMutate: boolean;
  readonly recipientDraft: string;
  readonly recipientDraftError: string | null;
  readonly recipientsTouched: boolean;
  readonly recipientEmails: readonly string[];
  readonly recipientValidation: OperatorRecipientValidationResult;
  readonly maskEmailForDisplay?: (email: string) => string;
  readonly directRecipientsHelper: string;
  readonly subscriptionsHelper?: ReactNode;
  readonly addRecipientTestId?: string;
  readonly recipientChipsTestId?: string;
  readonly recipientDraftErrorTestId?: string;
  readonly onRecipientDraftChange: (draft: string) => void;
  readonly onRecipientDraftBlur: () => void;
  readonly onAddRecipient: () => void;
  readonly onRemoveRecipient: (email: string) => void;
};

/** Chip-style direct recipient editor with shared validation error affordances. */
export function OperatorRecipientChipField(props: OperatorRecipientChipFieldProps): ReactElement {
  const draftInputId = `${props.idPrefix}-recipient-draft`;
  const helpId = `${props.idPrefix}-recipients-help`;
  const errorsId = `${props.idPrefix}-recipients-errors`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={draftInputId} className="font-semibold">
        {props.label}
      </Label>
      <div className="flex flex-wrap gap-2">
        <Input
          id={draftInputId}
          value={props.recipientDraft}
          onChange={(event) => props.onRecipientDraftChange(event.target.value)}
          onBlur={props.onRecipientDraftBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              props.onAddRecipient();
            }
          }}
          placeholder="name@company.com"
          disabled={!props.canMutate}
          aria-invalid={
            Boolean(props.recipientDraftError) ||
            (props.recipientsTouched && !props.recipientValidation.valid)
          }
          aria-describedby={`${helpId} ${errorsId}`}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!props.canMutate || props.recipientDraft.trim().length === 0}
          onClick={props.onAddRecipient}
          data-testid={props.addRecipientTestId}
        >
          Add
        </Button>
      </div>
      {props.recipientEmails.length > 0 ? (
        <ul
          className="m-0 flex list-none flex-wrap gap-2 p-0"
          data-testid={props.recipientChipsTestId}
          aria-label="Configured direct recipients"
        >
          {props.recipientEmails.map((email) => (
            <li
              key={email}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <span className={OPERATOR_TYPOGRAPHY.helper}>
                {props.maskEmailForDisplay !== undefined ? props.maskEmailForDisplay(email) : email}
              </span>
              {props.canMutate ? (
                <button
                  type="button"
                  className="text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-300"
                  onClick={() => props.onRemoveRecipient(email)}
                  aria-label={`Remove ${email}`}
                >
                  Remove
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <p id={helpId} className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {props.directRecipientsHelper}
      </p>
      {props.subscriptionsHelper !== undefined ? (
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {props.subscriptionsHelper}
        </p>
      ) : null}
      <div id={errorsId}>
        {props.recipientDraftError !== null ? (
          <p
            className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            role="alert"
            data-testid={props.recipientDraftErrorTestId}
          >
            {props.recipientDraftError}
          </p>
        ) : null}
        {props.recipientsTouched && props.recipientValidation.invalidAddresses.length > 0 ? (
          <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            Invalid email address
            {props.recipientValidation.invalidAddresses.length === 1 ? "" : "es"}:{" "}
            {props.recipientValidation.invalidAddresses.join(", ")}
          </p>
        ) : null}
        {props.recipientsTouched && props.recipientValidation.duplicateAddresses.length > 0 ? (
          <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            Duplicate recipient: {props.recipientValidation.duplicateAddresses.join(", ")}
          </p>
        ) : null}
        {props.recipientsTouched && props.recipientValidation.unsupportedGroupMailboxes.length > 0 ? (
          <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
            Unsupported group mailbox: {props.recipientValidation.unsupportedGroupMailboxes.join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type OperatorRecipientSubscriptionsHelperLinkProps = {
  readonly helperPrefix: string;
  readonly href: string;
  readonly linkLabel: string;
};

export function OperatorRecipientSubscriptionsHelperLink(
  props: OperatorRecipientSubscriptionsHelperLinkProps,
): ReactElement {
  return (
    <>
      {props.helperPrefix}{" "}
      <Link href={props.href} className="text-al-link underline-offset-2 hover:underline">
        {props.linkLabel}
      </Link>
      .
    </>
  );
}
