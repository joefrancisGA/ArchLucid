"use client";

import { useRouter } from "next/navigation";
import { useCallback, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { exitLiveSeatTraining } from "@/lib/auth/exit-live-seat-training";
import { AUTH_BOOTSTRAP_CANONICAL_PATH } from "@/lib/auth-bootstrap-evidence-copy";
import { BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA } from "@/lib/buyer/buyer-polish-copy";

export type SampleWorkspaceExitTrainingButtonProps = {
  readonly className?: string;
  readonly onAfterExit?: () => void;
};

/** Primary leave-Training control for sample scope surfaces (LS-014). */
export function SampleWorkspaceExitTrainingButton(
  props: SampleWorkspaceExitTrainingButtonProps,
): ReactElement {
  const router = useRouter();
  const { className, onAfterExit } = props;

  const onClick = useCallback(() => {
    void (async () => {
      const exited = await exitLiveSeatTraining();

      if (!exited) {
        router.replace(AUTH_BOOTSTRAP_CANONICAL_PATH);

        return;
      }

      onAfterExit?.();
      router.replace("/");
      router.refresh();
    })();
  }, [onAfterExit, router]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      data-testid="sample-workspace-exit-training-button"
      onClick={onClick}
    >
      {BUYER_SCOPE_BACK_TO_YOUR_WORKSPACE_CTA}
    </Button>
  );
}
