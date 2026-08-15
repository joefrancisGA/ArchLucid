"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getDocHref } from "@/lib/help/help-topics";

const WIZARD_DOC_LINKS: { title: string; docPath: string; blurb: string }[] = [
  {
    title: "First review wizard",
    docPath: "docs/library/FIRST_RUN_WIZARD.md",
    blurb: "End-to-end walkthrough from request through review, artifacts, and architect workflows.",
  },
  {
    title: "Architecture request templates",
    docPath: "docs/templates/architecture-requests/README.md",
    blurb: "Example payloads aligned with POST /v1/architecture/request for paste-import.",
  },
  {
    title: "Second review import and export",
    docPath: "docs/library/SECOND_RUN.md",
    blurb: "Schema and workflow for reusing a prepared request in the wizard or automation.",
  },
  {
    title: "Integration readiness",
    docPath: "docs/library/customer-facing/INTEGRATION_READINESS.md",
    blurb: "Connector health, programmatic client prerequisites, and where to download the OpenAPI contract.",
  },
];

/** Right-edge panel with links to official docs for the full architecture request wizard. */
export function ArchitectureRequestWizardHelpDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          data-testid="architecture-wizard-help-drawer-trigger"
        >
          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "fixed inset-y-0 left-auto top-0 flex h-full max-h-none w-full max-w-md translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border border-l border-neutral-200 bg-white p-0 text-neutral-900 shadow-xl duration-200 sm:rounded-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        )}
      >
        <DialogHeader className="space-y-1 border-b border-neutral-200 px-6 pb-4 pt-6 text-left dark:border-neutral-800">
          <DialogTitle>Documentation</DialogTitle>
          <DialogDescription>Open in-app help topics for the full architecture request wizard guides.</DialogDescription>
        </DialogHeader>
        <nav className="flex-1 overflow-y-auto px-6 py-4" aria-label="Architecture request documentation links">
          <ul className="m-0 list-none space-y-5 p-0">
            {WIZARD_DOC_LINKS.map((item) => {
              const href = getDocHref(item.docPath);

              if (href === null) {
                return null;
              }

              return (
                <li key={item.docPath}>
                  <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{item.title}</p>
                  <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{item.blurb}</p>
                  <Link
                    className={cn("mt-2 inline-block", OPERATOR_BODY_INLINE_LINK_CLASS)}
                    href={href}
                  >
                    View in Help
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
