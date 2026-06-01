"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { type HelpDocSearchRecord, searchHelpDocumentation } from "@/lib/help-index";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { cn } from "@/lib/utils";

export type HelpSearchPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the guides / shortcuts Help dialog (parent-owned). */
  onOpenGuidesPanel?: () => void;
};

/** Hand-curated entries shown before the user types — not derived from the index. */
const CURATED_START_HERE = [
  {
    id: "create-review",
    label: "Create your first review package",
    description: "Start the guided wizard to analyze an architecture.",
    href: "/reviews/new",
    category: "Guide",
  },
  {
    id: "upload-evidence",
    label: "Upload architecture evidence",
    description: "Attach evidence files, Azure extractor output, or scope notes.",
    href: "/help/evidence-intake",
    category: "Guide",
  },
  {
    id: "open-sample",
    label: "Open a completed sample review",
    description: "Walk through a finalized Claims Intake review package.",
    href: "/reviews/claims-intake-modernization",
    category: "Guide",
  },
  {
    id: "review-findings",
    label: "Review findings and evidence trail",
    description: "Trace findings, artifacts, and provenance in a review package.",
    href: "/help/evidence-trail",
    category: "Concepts",
  },
  {
    id: "finalize",
    label: "Finalize a review package",
    description: "Commit the signed decision record and export deliverables.",
    href: "/help/governance-approval",
    category: "Guide",
  },
  {
    id: "troubleshooting",
    label: "Troubleshoot common issues",
    description: "Home not loading, reviews missing, exports unavailable.",
    href: "/help/troubleshooting",
    category: "Troubleshooting",
  },
] as const;

/** Map doc path fragments to a short, reader-friendly category label. */
function friendlyCategoryLabel(docPath: string): string {
  const lower = docPath.toLowerCase();

  if (lower.includes("troubleshoot") || lower.includes("triage") || lower.includes("rescue")) {
    return "Troubleshooting";
  }

  if (lower.includes("admin_diagnostics") || lower.includes("observability") || lower.includes("configuration_reference")) {
    return "Admin";
  }

  if (lower.includes("concepts") || lower.includes("quickstart") || lower.includes("glossary")) {
    return "Concepts";
  }

  if (lower.includes("procurement") || lower.includes("faq") || lower.includes("trust") || lower.includes("executive")) {
    return "Go-to-market";
  }

  return "Guide";
}

function helpRecordHref(record: HelpDocSearchRecord): string {
  const path = record.docPath.startsWith("/") ? record.docPath : `/${record.docPath}`;
  const hash = record.sectionSlug.length > 0 ? `#${record.sectionSlug}` : "";

  return resolveInAppDocHref(`${path}${hash}`);
}

function helpRecordSelectionValue(record: HelpDocSearchRecord): string {
  return `${record.docPath}::${record.sectionSlug || "root"}::${record.sectionHeading}`;
}

function stripMdLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]*)\)/g, "$1");
}

/**
 * Slide-over documentation search (build-time index). Shift+/ opens via shell shortcut provider.
 * Empty state: curated help launcher. After typing: indexed search results.
 */
export function HelpSearchPanel({ open, onOpenChange, onOpenGuidesPanel }: HelpSearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const isSearching = query.trim().length > 0;
  const hits = useMemo(() => (isSearching ? searchHelpDocumentation(query) : []), [isSearching, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveValue("");
    }
  }, [open]);

  useEffect(() => {
    if (hits.length === 0) {
      setActiveValue("");

      return;
    }

    const firstValue = helpRecordSelectionValue(hits[0]);
    setActiveValue((current) => (hits.some((h) => helpRecordSelectionValue(h) === current) ? current : firstValue));
  }, [hits]);

  function navigate(href: string): void {
    onOpenChange(false);
    router.push(href);
  }

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
            Help
          </DialogTitle>
          <DialogDescription className="text-left text-sm">
            {isSearching
              ? "Showing matching documentation sections. Select a result to open the full Help topic."
              : "Select a topic or type to search all documentation."}
          </DialogDescription>
        </DialogHeader>

        <Command
          shouldFilter={false}
          value={activeValue}
          onValueChange={setActiveValue}
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-white dark:bg-neutral-950"
        >
          <label htmlFor="help-doc-search-input" className="sr-only">
            Search documentation
          </label>
          <CommandInput
            id="help-doc-search-input"
            placeholder="Search documentation…"
            value={query}
            onValueChange={setQuery}
            aria-label="Search documentation"
          />

          <CommandList className="max-h-none flex-1 overflow-y-auto" aria-label="Help topics">
            {isSearching ? (
              <>
                <CommandEmpty className="px-4 py-6 text-sm text-neutral-500 dark:text-neutral-400">
                  No sections matched. Try different keywords or browse Start here below.
                </CommandEmpty>
                <CommandGroup heading="Results" className="px-1">
                  {hits.map((h) => {
                    const selectionValue = helpRecordSelectionValue(h);
                    const category = friendlyCategoryLabel(h.docPath);

                    return (
                      <CommandItem
                        key={selectionValue}
                        value={selectionValue}
                        keywords={[h.docTitle, h.sectionHeading, h.excerpt]}
                        className="flex cursor-pointer flex-col items-start gap-0.5 rounded-md border border-transparent px-3 py-2.5 aria-selected:border-neutral-400 aria-selected:bg-[var(--al-layer-hover)] dark:aria-selected:border-neutral-600 dark:aria-selected:bg-neutral-800/80"
                        onPointerDown={() => setActiveValue(selectionValue)}
                        onPointerEnter={() => setActiveValue(selectionValue)}
                        onSelect={() => navigate(helpRecordHref(h))}
                      >
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{category}</span>
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{h.sectionHeading}</span>
                        <span className="line-clamp-2 text-xs leading-snug text-neutral-600 dark:text-neutral-300">
                          {stripMdLinks(h.excerpt)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ) : (
              <CommandGroup heading="Start here" className="px-1">
                {CURATED_START_HERE.map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={entry.id}
                    className="flex cursor-pointer flex-col items-start gap-0.5 rounded-md border border-transparent px-3 py-2.5 aria-selected:border-neutral-400 aria-selected:bg-[var(--al-layer-hover)] dark:aria-selected:border-neutral-600 dark:aria-selected:bg-neutral-800/80"
                    onPointerDown={() => setActiveValue(entry.id)}
                    onPointerEnter={() => setActiveValue(entry.id)}
                    onSelect={() => navigate(entry.href)}
                  >
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{entry.category}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{entry.label}</span>
                    <span className="text-xs leading-snug text-neutral-600 dark:text-neutral-300">{entry.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
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
          <p className="m-0 text-xs text-neutral-400 dark:text-neutral-500">
            <Link
              href="/help/developer-troubleshooting"
              className="underline-offset-2 hover:underline hover:text-neutral-600 dark:hover:text-neutral-300"
              onClick={() => onOpenChange(false)}
            >
              Engineering runbook
            </Link>
            {" — "}CLI, logs, environment variables
          </p>
          <p className="m-0 text-xs text-neutral-400 dark:text-neutral-500">
            Keyboard: arrows navigate · Enter opens · Escape closes · Shift+?
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
