import { InAppNavigationGuardDialog } from "@/components/navigation/InAppNavigationGuardDialog";
import { useInAppNavigationGuard } from "@/hooks/use-in-app-navigation-guard";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";

export const LIVELIHOOD_DOCUMENT_UNSAVED_MESSAGE =
  "You have unsaved changes. Leave this page without saving?";

export type UseLivelihoodDocumentGuardsArgs = {
  readonly when: boolean;
  readonly message?: string;
};

/** Reuses architecture-draft guard stack for other livelihood-grade operator forms (PT-18). */
export function useLivelihoodDocumentGuards(args: UseLivelihoodDocumentGuardsArgs): {
  readonly dialogOpen: boolean;
  readonly dialogMessage: string;
  readonly confirmLeave: () => void;
  readonly cancelLeave: () => void;
} {
  const message = args.message ?? LIVELIHOOD_DOCUMENT_UNSAVED_MESSAGE;

  useUnsavedChangesGuard({ when: args.when });
  const inAppNavigationGuard = useInAppNavigationGuard({
    when: args.when,
    message,
  });

  return {
    dialogOpen: inAppNavigationGuard.dialogOpen,
    dialogMessage: inAppNavigationGuard.dialogMessage,
    confirmLeave: inAppNavigationGuard.confirmLeave,
    cancelLeave: inAppNavigationGuard.cancelLeave,
  };
}

export function LivelihoodDocumentGuardDialog(props: {
  readonly open: boolean;
  readonly message: string;
  readonly onConfirmLeave: () => void;
  readonly onCancelLeave: () => void;
}): React.JSX.Element {
  return (
    <InAppNavigationGuardDialog
      open={props.open}
      message={props.message}
      onConfirmLeave={props.onConfirmLeave}
      onCancelLeave={props.onCancelLeave}
    />
  );
}
