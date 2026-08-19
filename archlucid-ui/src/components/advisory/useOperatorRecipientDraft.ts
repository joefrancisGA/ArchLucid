"use client";

import { useCallback, useMemo, useState } from "react";

export type OperatorRecipientValidationResult = {
  readonly valid: boolean;
  readonly invalidAddresses: readonly string[];
  readonly duplicateAddresses: readonly string[];
  readonly unsupportedGroupMailboxes: readonly string[];
};

export type UseOperatorRecipientDraftOptions = {
  readonly recipients: string;
  readonly canMutate: boolean;
  readonly parseEmails: (input: string) => string[];
  readonly validateEmails: (input: string) => OperatorRecipientValidationResult;
  readonly onRecipientsChange: (recipients: string) => void;
};

export type UseOperatorRecipientDraftResult = {
  readonly recipientDraft: string;
  readonly recipientDraftError: string | null;
  readonly recipientsTouched: boolean;
  readonly recipientEmails: string[];
  readonly recipientValidation: OperatorRecipientValidationResult;
  readonly setRecipientsTouched: (touched: boolean) => void;
  readonly onRecipientDraftChange: (draft: string) => void;
  readonly onRecipientDraftBlur: () => void;
  readonly addRecipientFromDraft: () => void;
  readonly removeRecipient: (email: string) => void;
  readonly resetRecipientDraftState: () => void;
};

/** Draft chip-input state shared by schedule delivery recipient editors. */
export function useOperatorRecipientDraft(
  options: UseOperatorRecipientDraftOptions,
): UseOperatorRecipientDraftResult {
  const [recipientDraft, setRecipientDraft] = useState("");
  const [recipientDraftError, setRecipientDraftError] = useState<string | null>(null);
  const [recipientsTouched, setRecipientsTouched] = useState(false);

  const recipientValidation = useMemo(
    () => options.validateEmails(options.recipients),
    [options.recipients, options.validateEmails],
  );

  const recipientEmails = useMemo(
    () => options.parseEmails(options.recipients),
    [options.parseEmails, options.recipients],
  );

  function onRecipientDraftChange(draft: string): void {
    setRecipientDraft(draft);
    setRecipientDraftError(null);
  }

  function onRecipientDraftBlur(): void {
    setRecipientsTouched(true);
  }

  function addRecipientFromDraft(): void {
    if (!options.canMutate) {
      return;
    }

    const draft = recipientDraft.trim();

    if (draft.length === 0) {
      return;
    }

    const additions = options.parseEmails(draft);
    const draftValidation = options.validateEmails(draft);

    if (draftValidation.invalidAddresses.length > 0) {
      setRecipientDraftError(
        `Invalid email address${draftValidation.invalidAddresses.length === 1 ? "" : "es"}: ${draftValidation.invalidAddresses.join(", ")}`,
      );
      setRecipientsTouched(true);

      return;
    }

    if (draftValidation.duplicateAddresses.length > 0) {
      setRecipientDraftError(`Duplicate recipient: ${draftValidation.duplicateAddresses.join(", ")}`);
      setRecipientsTouched(true);

      return;
    }

    if (draftValidation.unsupportedGroupMailboxes.length > 0) {
      setRecipientDraftError(
        `Unsupported group mailbox: ${draftValidation.unsupportedGroupMailboxes.join(", ")}`,
      );
      setRecipientsTouched(true);

      return;
    }

    const existing = options.parseEmails(options.recipients);
    const existingKeys = new Set(existing.map((entry) => entry.toLowerCase()));
    const colliding = additions.filter((entry) => existingKeys.has(entry.toLowerCase()));

    if (colliding.length > 0) {
      setRecipientDraftError(`Duplicate recipient: ${colliding.join(", ")}`);
      setRecipientsTouched(true);

      return;
    }

    options.onRecipientsChange([...existing, ...additions].join("; "));
    setRecipientDraft("");
    setRecipientDraftError(null);
    setRecipientsTouched(true);
  }

  function removeRecipient(email: string): void {
    if (!options.canMutate) {
      return;
    }

    const next = options.parseEmails(options.recipients).filter(
      (entry) => entry.toLowerCase() !== email.toLowerCase(),
    );
    options.onRecipientsChange(next.join("; "));
    setRecipientsTouched(true);
  }

  function resetRecipientDraftState(): void {
    setRecipientsTouched(false);
    setRecipientDraft("");
    setRecipientDraftError(null);
  }

  const resetRecipientDraftStateStable = useCallback((): void => {
    resetRecipientDraftState();
  }, []);

  return {
    recipientDraft,
    recipientDraftError,
    recipientsTouched,
    recipientEmails,
    recipientValidation,
    setRecipientsTouched,
    onRecipientDraftChange,
    onRecipientDraftBlur,
    addRecipientFromDraft,
    removeRecipient,
    resetRecipientDraftState: resetRecipientDraftStateStable,
  };
}
