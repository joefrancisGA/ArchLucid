"use client";

import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID,
  FIRST_SESSION_PURPOSE_CHOOSER_TITLE,
  FIRST_SESSION_PURPOSE_LIVE_BODY,
  FIRST_SESSION_PURPOSE_LIVE_BUTTON_TEST_ID,
  FIRST_SESSION_PURPOSE_LIVE_CTA,
  FIRST_SESSION_PURPOSE_TRAINING_BODY,
  FIRST_SESSION_PURPOSE_TRAINING_BUTTON_TEST_ID,
  FIRST_SESSION_PURPOSE_TRAINING_CTA,
} from "@/lib/auth/first-session-purpose-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FirstSessionPurposeChooserProps = {
  readonly open: boolean;
  readonly pending: boolean;
  readonly onChooseLive: () => void;
  readonly onChooseTraining: () => void;
};

export function FirstSessionPurposeChooser(props: FirstSessionPurposeChooserProps): ReactElement {
  return (
    <Dialog open={props.open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-w-lg"
        data-testid={FIRST_SESSION_PURPOSE_CHOOSER_TEST_ID}
        onPointerDownOutside={(event) => {
          event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{FIRST_SESSION_PURPOSE_CHOOSER_TITLE}</DialogTitle>
          <DialogDescription className={OPERATOR_TYPOGRAPHY.body}>
            Choose where to start. You can switch to sample data later from Training surfaces.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
            <p className={OPERATOR_TYPOGRAPHY.body}>{FIRST_SESSION_PURPOSE_LIVE_BODY}</p>
            <DialogFooter className="mt-4 sm:justify-start">
              <Button
                type="button"
                disabled={props.pending}
                data-testid={FIRST_SESSION_PURPOSE_LIVE_BUTTON_TEST_ID}
                onClick={props.onChooseLive}
              >
                {FIRST_SESSION_PURPOSE_LIVE_CTA}
              </Button>
            </DialogFooter>
          </div>
          <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
            <p className={OPERATOR_TYPOGRAPHY.body}>{FIRST_SESSION_PURPOSE_TRAINING_BODY}</p>
            <DialogFooter className="mt-4 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                disabled={props.pending}
                data-testid={FIRST_SESSION_PURPOSE_TRAINING_BUTTON_TEST_ID}
                onClick={props.onChooseTraining}
              >
                {FIRST_SESSION_PURPOSE_TRAINING_CTA}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
