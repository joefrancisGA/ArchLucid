"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { type HelpDocSearchRecord, searchHelpDocumentation } from "@/lib/help-index";
import { cn } from "@/lib/utils";

export type HelpSearchPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the guides / shortcuts Help dialog (parent-owned). */
  onOpenGuidesPanel?: () => void;
};

function helpRecordHref(record: HelpDocSearchRecord): string {
  const path = record.docPath.startsWith("/") ? record.docPath : `/${record.docPath}`;
  const hash = record.sectionSlug.length > 0 ? `#${record.sectionSlug}` : "";

  return toDocsBlobUrl(`${path}${hash}`);
}

function stripMdLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]*)\)/g, "$1");
}

/**
 * Slide-over documentation search (build-time index). Shift+/ opens via shell shortcut provider.
 */
export function HelpSearchPanel({ open, onOpenChange, onOpenGuidesPanel }: HelpSearchPanelProps) {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => searchHelpDocumentation(query), [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="help-search-panel"
        className={cn(
          "fixed inset-y-0 right-0 top-0 z-[51] flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border border-l-neutral-200 border-r-0 border-t-0 p-0 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right sm:max-w-lg dark:border-l-neutral-700 dark:bg-neutral-950",
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-neutral-200 px-4 pb-3 pt-4 text-left dark:border-neutral-800">
          <DialogTitle className="text-left text-lg text-neutral-900 dark:text-neutral-100">
            Documentation search
          </DialogTitle>
          <DialogDescription className="text-left text-sm">
            Search curated operator docs on GitHub (indexed at build time). Results open in a new tab.
          </DialogDescription>
        </DialogHeader>

        <Command
          shouldFilter={false}
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-white dark:bg-neutral-950"
          loop
        >
          <label htmlFor="help-doc-search-input" className="sr-only">
            Search documentation sections
          </label>
          <CommandInput
            id="help-doc-search-input"
            placeholder="Try “create a run”, configuration, troubleshooting…"
            value={query}
            onValueChange={setQuery}
            aria-label="Search documentation sections"
          />
          <CommandList className="max-h-none flex-1 overflow-y-auto" aria-label="Documentation search results">
            <CommandEmpty className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
              No sections matched. Try different keywords or open guides below.
            </CommandEmpty>
            <CommandGroup
              heading={query.trim().length > 0 ? "Matching sections" : "Start here"}
              className="px-1"
            >
              {hits.map((h) => {
                const href = helpRecordHref(h);

                return (
                  <CommandItem
                    key={`${h.docPath}::${h.sectionSlug || "root"}::${h.sectionHeading}`}
                    value={`${h.docTitle} ${h.sectionHeading} ${h.excerpt}`}
                    className="flex cursor-pointer flex-col items-start gap-1 rounded-md border border-transparent px-3 py-2.5 aria-selected:border-neutral-400 aria-selected:bg-[var(--al-layer-hover)] dark:aria-selected:border-neutral-600 dark:aria-selected:bg-neutral-800/80"
                    onSelect={() => {
                      window.open(href, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <span className="flex w-full items-start justify-between gap-2 text-left">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        {h.docTitle}
                      </span>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                    </span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{h.sectionHeading}</span>
                    <span className="line-clamp-3 text-xs leading-snug text-neutral-600 dark:text-neutral-300">
                      {stripMdLinks(h.excerpt)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="shrink-0 space-y-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          {onOpenGuidesPanel ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                onOpenChange(false);
                onOpenGuidesPanel();
              }}
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
              Guides, shortcuts &amp; troubleshooting
            </Button>
          ) : null}
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
            Keyboard: arrows navigate · Enter opens · Escape closes · Shortcut Shift+?
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
