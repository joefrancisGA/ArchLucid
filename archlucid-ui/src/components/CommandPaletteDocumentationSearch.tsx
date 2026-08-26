import { cn } from "@/lib/utils";

import { CommandGroup, CommandItem } from "@/components/ui/command";
import { DOCUMENTATION_SEARCH_ITEMS, resolveDocumentationHref } from "@/lib/docs-search-index";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export function CommandPaletteDocumentationSearch({
  buyerPolishedShell,
  onNavigate,
}: {
  buyerPolishedShell: boolean;
  onNavigate: (href: string) => void;
}) {
  return (
    <CommandGroup heading={buyerPolishedShell ? "Help topics" : "Documentation"}>
      {DOCUMENTATION_SEARCH_ITEMS.map((row) => {
        const href = resolveDocumentationHref(row.relativeDocsPath);

        return (
          <CommandItem
            key={row.relativeDocsPath}
            value={`doc ${row.title} ${row.description} ${row.category} ${row.relativeDocsPath}`}
            className="cursor-pointer"
            onSelect={() => onNavigate(href)}
          >
            {/*
             * Render a real <a> so the browser provides right-click → "Open in new tab",
             * Ctrl+Click, and middle-click. For plain left-clicks we preventDefault and
             * delegate to the SPA router so the dialog closes cleanly.
             */}
            <a
              href={href}
              className="flex w-full items-center"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  onNavigate(href);
                }
              }}
            >
              <span className="font-medium">{row.title}</span>
              <span className={cn("ml-2 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{row.category}</span>
            </a>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
