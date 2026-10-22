"use client";

import { ClipboardList } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CreateWorkItemDialog } from "@/components/work-items/CreateWorkItemDialog";
import { Button } from "@/components/ui/button";
import {
  buildArchitectureWorkItemPreview,
  pickNativeCreateFindingId,
  type BuildArchitectureWorkItemPreviewInput,
} from "@/lib/architecture/architecture-work-item-model";
import { CREATE_WORK_ITEM_LABEL } from "@/lib/create-work-item-copy";
import { findingWorkItemSealedManifestCopyBlockedReason } from "@/lib/findings/finding-work-item-sealed-manifest-guard";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  createWorkItemDialogHrefFromSearch,
  parseCreateWorkItemFindingIdFromSearch,
  parseCreateWorkItemOpenFromSearch,
} from "@/lib/work-items/create-work-item-dialog-url";

export type CreateWorkItemButtonProps = BuildArchitectureWorkItemPreviewInput & {
  readonly compact?: boolean;
  readonly className?: string;
  readonly manifestVersion?: string | null;
};

/** Secondary outline trigger for the provider-neutral create-work-item dialog. */
export function CreateWorkItemButton(props: CreateWorkItemButtonProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const searchParams = useSearchParams();
  const workItemOpenParam = searchParams.get("workItemOpen");
  const workItemFindingIdParam = searchParams.get("workItemFindingId");
  const [open, setOpenState] = useState(() => parseCreateWorkItemOpenFromSearch(workItemOpenParam));

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

  const syncWorkItemDialogToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(
        createWorkItemDialogHrefFromSearch(
          searchParams.toString(),
          {
            open: nextOpen,
            findingId: nextOpen ? nativeCreateFindingId : null,
          },
          pathname,
        ),
        { scroll: false },
      );
    },
    [nativeCreateFindingId, pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncWorkItemDialogToUrl(next);

        return next;
      });
    },
    [syncWorkItemDialogToUrl],
  );

  useEffect(() => {
    const urlOpen = parseCreateWorkItemOpenFromSearch(workItemOpenParam);
    const urlFindingId = parseCreateWorkItemFindingIdFromSearch(workItemFindingIdParam);

    if (!urlOpen) {
      setOpenState(false);

      return;
    }

    if (urlFindingId.length > 0 && nativeCreateFindingId !== null && urlFindingId !== nativeCreateFindingId) {
      setOpenState(false);

      return;
    }

    setOpenState(true);
  }, [nativeCreateFindingId, workItemFindingIdParam, workItemOpenParam]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          props.compact ? "h-7 gap-1 px-2" : "h-8 gap-1.5",
          props.className,
        )}
        onClick={() => {
          const blockedReason = findingWorkItemSealedManifestCopyBlockedReason({
            runId: props.runId,
            manifestVersion: props.manifestVersion,
          });

          if (blockedReason !== null) {
            showError(blockedReason);

            return;
          }

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
