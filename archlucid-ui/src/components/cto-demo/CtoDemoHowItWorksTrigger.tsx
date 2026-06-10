"use client";

import { Shield } from "lucide-react";
import { useState } from "react";

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HOW_IT_WORKS_MARKDOWN } from "@/lib/how-it-works-markdown";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const HOW_IT_WORKS_SLUG = "how-it-works";

export type CtoDemoHowItWorksTriggerProps = {
  readonly variant?: "button" | "link";
};

export function CtoDemoHowItWorksTrigger(props: CtoDemoHowItWorksTriggerProps): React.JSX.Element {
  const { variant = "button" } = props;
  const [open, setOpen] = useState(false);
  const entry = getProductDocumentationEntry(HOW_IT_WORKS_SLUG);

  const trigger =
    variant === "link" ? (
      <button
        type="button"
        className="text-sm font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
        data-testid="cto-demo-how-it-works-link"
      >
        How we handle your data →
      </button>
    ) : (
      <Button type="button" variant="ghost" size="sm" className="h-8 px-2" data-testid="cto-demo-how-it-works-trigger">
        <Shield className="mr-1 h-3.5 w-3.5" aria-hidden />
        How it works
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" data-testid="cto-demo-how-it-works-dialog">
        <DialogHeader>
          <DialogTitle>What ArchLucid does with your data</DialogTitle>
          <DialogDescription>Factual data-flow and isolation posture for CTO diligence.</DialogDescription>
        </DialogHeader>
        <HelpTopicMarkdownView
          entry={
            entry ?? {
              slug: HOW_IT_WORKS_SLUG,
              title: "What ArchLucid does with your data",
              summary: "",
              audience: "buyer",
              sourcePaths: [],
            }
          }
          markdown={HOW_IT_WORKS_MARKDOWN}
        />
      </DialogContent>
    </Dialog>
  );
}
