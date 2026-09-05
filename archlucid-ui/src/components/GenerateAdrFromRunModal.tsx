"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { FileDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { BUYER_VIEW_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { buildMadrMarkdownFromRun, type AdrGeneratorRunInput } from "@/lib/adr-from-run";
import {
  parseReviewGenerateAdrOpenFromSearch,
  reviewGenerateAdrPanelsHrefFromSearch,
} from "@/lib/reviews/review-generate-adr-panels-url";

export type GenerateAdrFromRunModalProps = {
  input: AdrGeneratorRunInput;
  /** Buyer-polished review detail: soften ADR jargon into decision-record language. */
  buyerPolished?: boolean;
};

/**
 * Run detail action: drafts a MADR-style ADR in-browser from serialized run + explanation payload (no extra HTTP).
 */
export function GenerateAdrFromRunModal({ input, buyerPolished = false }: GenerateAdrFromRunModalProps) {
  const router = useRouter();
  const pathname = usePathname() ?? `/architecture/reviews/${input.runId}`;
  const searchParams = useSearchParams();
  const adrOpenParam = searchParams.get("adrOpen");
  const [open, setOpenState] = useState(() => parseReviewGenerateAdrOpenFromSearch(adrOpenParam));
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const syncAdrOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      router.replace(reviewGenerateAdrPanelsHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncAdrOpenToUrl(next);

        return next;
      });
    },
    [syncAdrOpenToUrl],
  );

  const seedFromInput = useCallback(() => {
    setMarkdown(buildMadrMarkdownFromRun(input));
  }, [input]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);

      if (next) {
        seedFromInput();
        setCopied(false);
      }
    },
    [seedFromInput],
  );

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch {
      /* clipboard unavailable */
    }
  }, [markdown]);

  const onDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `adr-archlucid-${input.runId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [input.runId, markdown]);

  return (
    <>
      <Button type="button" variant="outline" data-testid="generate-adr-button" onClick={() => onOpenChange(true)}>
        {buyerPolished ? BUYER_VIEW_SIGNED_RECORD_CTA : "Generate ADR"}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[min(90vh,56rem)] max-w-3xl gap-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{buyerPolished ? "Decision record draft" : "Architecture Decision Record"}</DialogTitle>
            <DialogDescription>
              {buyerPolished
                ? "MADR-style draft you can copy into your enterprise decision-register or CAB packet. Edit the Markdown, then copy or download — nothing is stored server-side."
                : "MADR-inspired draft from this review's findings and aggregate AI assessment. Edit the Markdown, then copy or download — nothing is stored server-side."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)} htmlFor="adr-markdown-editor">
              Markdown
            </label>
            <Textarea
              id="adr-markdown-editor"
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
              }}
              spellCheck={false}
              className={cn("min-h-[14rem] font-mono leading-relaxed md:min-h-[18rem]", OPERATOR_TYPOGRAPHY.micro, (cn("md:font-normal md:leading-5 md:", OPERATOR_TYPOGRAPHY.helper)))}
              aria-label="Architecture decision record markdown"
            />
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
            <Button type="button" variant="outline" onClick={seedFromInput} title="Discard edits and rebuild from run data">
              Reset to template
            </Button>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void onCopy();
                }}
              >
                {copied ? "Copied" : "Copy to clipboard"}
              </Button>
              <Button type="button" variant="default" onClick={onDownload}>
                <FileDown className="mr-2 size-4" aria-hidden />
                Download .md
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
