"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useState, type ChangeEvent, type ReactElement, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { downloadConsultingArchitectureReportDocx } from "@/lib/api";
import {
  CONSULTING_DOCX_EXPORT_PERMISSION,
  principalHasPermission,
} from "@/lib/current-principal";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import { showError } from "@/lib/toast";
import {
  parseReviewConsultingExportOpenFromSearch,
  reviewConsultingExportPanelsHrefFromSearch,
} from "@/lib/reviews/review-consulting-export-panels-url";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

export type ReviewBoardWhitelabelConsultingExportButtonProps = {
  runId: string;
  readonly manifestVersion?: string | null;
};

async function readImageFileAsRawBase64(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (): void => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Logo could not be read."));
        return;
      }

      const commaIndex = result.indexOf(",");

      if (commaIndex >= 0) resolve(result.slice(commaIndex + 1));

      else resolve(result);
    };

    reader.onerror = (): void => {
      reject(reader.error ?? new Error("Logo could not be read."));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Consulting DOCX export with optional review-board cover branding (firm label, engagement headline, uploaded logo).
 */
export function ReviewBoardWhitelabelConsultingExportButton(
  props: ReviewBoardWhitelabelConsultingExportButtonProps,
): ReactElement | null {
  const { runId, manifestVersion = null } = props;
  const { currentPrincipal } = useOperatorNavAuthority();
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${runId}`;
  const searchParams = useSearchParams();
  const consultingExportOpenParam = searchParams.get("consultingExportOpen");
  const [open, setOpenState] = useState(() =>
    parseReviewConsultingExportOpenFromSearch(consultingExportOpenParam),
  );
  const [busy, setBusy] = useState(false);
  const [firmDisplayName, setFirmDisplayName] = useState("");
  const [engagementTitle, setEngagementTitle] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion,
  });

  const resetForm = useCallback(() => {
    setFirmDisplayName("");
    setEngagementTitle("");
    setLogoFile(null);
  }, []);

  const syncConsultingExportToUrl = useCallback(
    (exportOpen: boolean) => {
      router.replace(
        reviewConsultingExportPanelsHrefFromSearch(searchParams.toString(), exportOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncConsultingExportToUrl(next);

        if (!next) {
          resetForm();
        }

        return next;
      });
    },
    [resetForm, syncConsultingExportToUrl],
  );

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
    },
    [setOpen],
  );

  if (!principalHasPermission(currentPrincipal, CONSULTING_DOCX_EXPORT_PERMISSION)) {
    return null;
  }

  async function onConfirmExport(): Promise<void> {
    if (sealedManifestBlockedReason !== null) {
      return;
    }

    recordFirstExportOpenedOnce();
    setBusy(true);

    try {
      let logoBase64: string | undefined;

      if (logoFile !== null && logoFile.size > 0) {
        logoBase64 = await readImageFileAsRawBase64(logoFile);
      }

      await downloadConsultingArchitectureReportDocx(runId, {
        reviewBoardWhitelabelFirmDisplayName: firmDisplayName.trim(),
        reviewBoardWhitelabelClientEngagementTitle: engagementTitle.trim(),
        reviewBoardWhitelabelLogoBase64: logoBase64,
      });

      setOpen(false);
      resetForm();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);

      showError("Could not export consulting DOCX", msg);
    } finally {
      setBusy(false);
    }
  }

  function onLogoSelected(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;

    if (files !== null && files.length > 0) {
      setLogoFile(files.item(0));
    } else {
      setLogoFile(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="open-whitelabel-consulting-export"
          className="h-9"
          disabled={sealedManifestBlockedReason !== null}
          onClick={() => {
            setOpen(true);
          }}
        >
          Firm-branded consulting export
        </Button>
        {sealedManifestBlockedReason !== null ? (
          <p
            role="alert"
            className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="whitelabel-consulting-export-blocked-reason"
          >
            {sealedManifestBlockedReason}
          </p>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg gap-4" data-testid="whitelabel-export-modal">
          <DialogHeader>
            <DialogTitle>Review board packaging</DialogTitle>
            <DialogDescription>
              Optional labels and logo appear on the consulting DOCX cover. The API validates logo size server-side.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} htmlFor="whitelabel-firm-display-name">
                Firm display name
              </label>
              <Input
                id="whitelabel-firm-display-name"
                data-testid="whitelabel-firm-display-name"
                value={firmDisplayName}
                onChange={(e) => {
                  setFirmDisplayName(e.target.value);
                }}
                autoComplete="organization"
              />
            </div>
            <div className="space-y-1">
              <label
                className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
                htmlFor="whitelabel-client-engagement-title"
              >
                Client engagement title
              </label>
              <Input
                id="whitelabel-client-engagement-title"
                data-testid="whitelabel-client-engagement-title"
                value={engagementTitle}
                onChange={(e) => {
                  setEngagementTitle(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} htmlFor="whitelabel-logo-file">
                Logo image file
              </label>
              <Input
                id="whitelabel-logo-file"
                data-testid="whitelabel-logo-file"
                type="file"
                accept="image/*"
                onChange={onLogoSelected}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={busy}
              aria-busy={busy}
              data-testid="whitelabel-consulting-export-submit"
              className="inline-flex items-center gap-2"
              onClick={() => void onConfirmExport()}
            >
              {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
              Export DOCX
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
