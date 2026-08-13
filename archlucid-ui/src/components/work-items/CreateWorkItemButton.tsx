"use client";

import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";

import { CreateWorkItemDialog } from "@/components/work-items/CreateWorkItemDialog";
import { Button } from "@/components/ui/button";
import {
  buildArchitectureWorkItemPreview,
  pickNativeCreateFindingId,
  type BuildArchitectureWorkItemPreviewInput,
} from "@/lib/architecture/architecture-work-item-model";
import { CREATE_WORK_ITEM_LABEL } from "@/lib/create-work-item-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CreateWorkItemButtonProps = BuildArchitectureWorkItemPreviewInput & {
  readonly compact?: boolean;
  readonly className?: string;
};

/** Secondary outline trigger for the provider-neutral create-work-item dialog. */
export function CreateWorkItemButton(props: CreateWorkItemButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  const preview = useMemo(() => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : props.siteOrigin;

    return buildArchitectureWorkItemPreview({
      runId: props.runId,
      architectureName: props.architectureName,
      architectureOverview: props.architectureOverview,
      ownerLabel: props.ownerLabel,
      findings: props.findings,
      siteOrigin,
    });
  }, [
    props.architectureName,
    props.architectureOverview,
    props.findings,
    props.ownerLabel,
    props.runId,
    props.siteOrigin,
  ]);

  const nativeCreateFindingId = useMemo(() => pickNativeCreateFindingId(props.findings), [props.findings]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          props.compact ? "h-7 gap-1 px-2 text-[0.65rem]" : cn("h-8 gap-1.5", OPERATOR_TYPOGRAPHY.helper),
          props.className,
        )}
        onClick={() => {
          setOpen(true);
        }}
        data-testid="create-work-item-open"
        aria-label={CREATE_WORK_ITEM_LABEL}
      >
        <ClipboardList className="size-3.5" aria-hidden />
        {CREATE_WORK_ITEM_LABEL}
      </Button>
      <CreateWorkItemDialog
        open={open}
        onOpenChange={setOpen}
        runId={props.runId}
        preview={preview}
        nativeCreateFindingId={nativeCreateFindingId}
      />
    </>
  );
}
