"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_ADD_LABEL,
  ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_CONTINUE_LABEL,
  ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_DESCRIPTION,
  ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_DISMISS_LABEL,
  ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_TITLE,
} from "@/lib/architecture/architecture-draft-quality-attributes-encouragement";

type ArchitectureDraftQualityAttributesEncouragementDialogProps = {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onAddQualityAttributes: () => void;
  readonly onContinueWithout: () => void;
};

export function ArchitectureDraftQualityAttributesEncouragementDialog(
  props: ArchitectureDraftQualityAttributesEncouragementDialogProps,
): React.JSX.Element {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent data-testid="architecture-draft-quality-attributes-encouragement-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_DESCRIPTION}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={props.busy}>
            {ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_DISMISS_LABEL}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.busy}
            onClick={props.onContinueWithout}
            data-testid="architecture-draft-quality-attributes-encouragement-continue"
          >
            {ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_CONTINUE_LABEL}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={props.busy}
            onClick={props.onAddQualityAttributes}
            data-testid="architecture-draft-quality-attributes-encouragement-add"
          >
            {ARCHITECTURE_DRAFT_QUALITY_ATTRIBUTES_ENCOURAGEMENT_ADD_LABEL}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
