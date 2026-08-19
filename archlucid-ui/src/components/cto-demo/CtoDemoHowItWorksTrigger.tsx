"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Shield } from "lucide-react";
import { cloneElement, isValidElement, useState, type ReactElement } from "react";

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
import { CtoDemoTenantIsolationProofCallout } from "@/components/cto-demo/CtoDemoTenantIsolationProofCallout";
import { DATA_HANDLING_MARKDOWN } from "@/lib/how-it-works-markdown";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

const DATA_HANDLING_SLUG = "data-handling";

export type CtoDemoHowItWorksTriggerProps = {
  readonly variant?: "button" | "link";
  readonly focusSection?: "isolation";
  readonly trigger?: ReactElement;
};

export function CtoDemoHowItWorksTrigger(props: CtoDemoHowItWorksTriggerProps): React.JSX.Element {
  const { variant = "button", focusSection, trigger: customTrigger } = props;
  const [open, setOpen] = useState(false);
  const entry = getProductDocumentationEntry(DATA_HANDLING_SLUG);

  const defaultTrigger =
    variant === "link" ? (
      <button
        type="button"
        className={OPERATOR_BODY_INLINE_LINK_CLASS}
        data-testid="cto-demo-how-it-works-link"
      >
        How we handle your data →
      </button>
    ) : (
      <Button type="button" variant="outline" size="sm" className="h-8 px-2" data-testid="cto-demo-how-it-works-trigger">
        <Shield className="mr-1 h-3.5 w-3.5" aria-hidden />
        How it works
      </Button>
    );

  const trigger =
    customTrigger !== undefined && isValidElement(customTrigger)
      ? cloneElement(customTrigger as ReactElement<Record<string, unknown>>, {
          "data-testid":
            (customTrigger as ReactElement<Record<string, unknown>>).props["data-testid"]
            ?? "cto-demo-how-it-works-custom-trigger",
        })
      : defaultTrigger;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" data-testid="cto-demo-how-it-works-dialog">
        <DialogHeader>
          <DialogTitle>What ArchLucid does with your data</DialogTitle>
          <DialogDescription>Factual data-flow and isolation posture for CTO diligence.</DialogDescription>
        </DialogHeader>
        {focusSection === "isolation" ? <CtoDemoTenantIsolationProofCallout /> : null}
        <HelpTopicMarkdownView
          entry={
            entry ?? {
              slug: DATA_HANDLING_SLUG,
              title: "What ArchLucid does with your data",
              summary: "",
              audience: "buyer",
              contentKind: "product-help",
              sourcePaths: [],
              pdfStatus: "public",
            }
          }
          markdown={DATA_HANDLING_MARKDOWN}
        />
      </DialogContent>
    </Dialog>
  );
}
