"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { downloadTerraformAdvisoryExportZip } from "@/lib/api";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import { showError } from "@/lib/toast";
import { TERRAFORM_ADVISORY_EXPORT_DISCLAIMER } from "@/lib/terraform-advisory-disclaimer";
import { cn } from "@/lib/utils";

export type ExportTerraformAdvisoryButtonProps = {
  runId: string;
};

/** Run detail action: downloads advisory Terraform placeholder ZIP via API (disclaimer gate). */
export function ExportTerraformAdvisoryButton(props: ExportTerraformAdvisoryButtonProps): ReactNode {
  const { runId } = props;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const runDownload = useCallback(async () => {
    setBusy(true);

    try {
      recordFirstExportOpenedOnce();
      await downloadTerraformAdvisoryExportZip(runId);
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showError("Could not download Terraform export", msg);
    } finally {
      setBusy(false);
    }
  }, [runId]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="export-terraform-advisory-button"
        onClick={() => setOpen(true)}
      >
        Export to Terraform
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (busy) {
            return;
          }

          setOpen(next);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export advisory Terraform</AlertDialogTitle>
            <AlertDialogDescription>{TERRAFORM_ADVISORY_EXPORT_DISCLAIMER}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={cn(
                "border-transparent bg-neutral-900 text-neutral-50 shadow-sm hover:bg-neutral-800 hover:text-neutral-50 focus-visible:ring-neutral-400 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 dark:focus-visible:ring-neutral-500",
              )}
              onClick={(e) => {
                e.preventDefault();
                void runDownload();
              }}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                  Downloading…
                </span>
              ) : (
                "Download ZIP"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
