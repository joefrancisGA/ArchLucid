"use client";

import { FileDown } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
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

export type GenerateAdrFromRunModalProps = {
  input: AdrGeneratorRunInput;
  /** Buyer-polished review detail: soften ADR jargon into decision-record language. */
  buyerPolished?: boolean;
};

/**
 * Run detail action: drafts a MADR-style ADR in-browser from serialized run + explanation payload (no extra HTTP).
 */
export function GenerateAdrFromRunModal({ input, buyerPolished = false }: GenerateAdrFromRunModalProps) {
  const [open, setOpen] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
        {buyerPolished ? "Open decision record" : "Generate ADR"}
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
            <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200" htmlFor="adr-markdown-editor">
              Markdown
            </label>
            <Textarea
              id="adr-markdown-editor"
              value={markdown}
              onChange={(e) => {
                setMarkdown(e.target.value);
              }}
              spellCheck={false}
              className="min-h-[14rem] font-mono text-xs leading-relaxed md:min-h-[18rem] md:text-sm"
              aria-label="Architecture decision record markdown"
            />
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
            <Button type="button" variant="ghost" onClick={seedFromInput} title="Discard edits and rebuild from run data">
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
