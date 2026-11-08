"use client";

import { usePathname } from "next/navigation";
import { useCommandState } from "cmdk";

import { resolveDeskContinuityReviewOpenHref } from "@/lib/architecture/resolve-desk-continuity-review-href";
import { CommandGroup, CommandItem } from "@/components/ui/command";

const RUN_ID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function RunIdQuickOpen({
  onNavigate,
  allowRunIdPaste,
}: {
  onNavigate: (href: string) => void;
  allowRunIdPaste: boolean;
}) {
  const pathname = usePathname() ?? "";
  const search = useCommandState((state) => state.search);
  const trimmed = search.trim();

  if (!allowRunIdPaste || !RUN_ID_LIKE.test(trimmed)) {
    return null;
  }

  return (
    <CommandGroup heading="Quick open">
      <CommandItem
        value={`open-review-${trimmed}`}
        onSelect={() => {
          onNavigate(resolveDeskContinuityReviewOpenHref(trimmed, { pathname }));
        }}
      >
        Open linked review
      </CommandItem>
    </CommandGroup>
  );
}
