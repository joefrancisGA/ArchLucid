"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SPECIALTY_REVIEW_TEMPLATES_PREVIEW_CLOSE_LABEL,
  SPECIALTY_REVIEW_TEMPLATES_PREVIEW_DISCLAIMER,
  SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL,
  type SpecialtyReviewPolicyPackReference,
  type SpecialtyReviewTemplateDefinition,
} from "@/lib/specialty-review-templates";
import { cn } from "@/lib/utils";

export type SpecialtyTemplatePreviewState = {
  readonly template: SpecialtyReviewTemplateDefinition;
};

function PreviewPolicyPackLinks(props: { readonly packs: readonly SpecialtyReviewPolicyPackReference[] }): React.ReactElement {
  return (
    <ul className={cn("m-0 mt-2 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
      {props.packs.map((pack) => (
        <li key={pack.id}>
          <Link href={pack.href} className={cn(OPERATOR_LINK.inline)}>
            {pack.label} v{pack.version}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PreviewSection(props: { readonly title: string; readonly items: readonly string[] }): React.ReactElement {
  return (
    <section aria-label={props.title}>
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</h3>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {props.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PreviewTemplateSummary(props: { readonly template: SpecialtyReviewTemplateDefinition }): React.ReactElement {
  return (
    <div
      className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="specialty-template-preview-summary"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-semibold text-al-text-primary">Best for:</span> {props.template.bestFor}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-semibold text-al-text-primary">Focus areas:</span> {props.template.focusAreas.join(", ")}
      </p>
    </div>
  );
}

export type SpecialtyTemplatePreviewDialogProps = {
  readonly preview: SpecialtyTemplatePreviewState | null;
  readonly onClose: () => void;
};

export function SpecialtyTemplatePreviewDialog(props: SpecialtyTemplatePreviewDialogProps): React.ReactElement {
  const template = props.preview?.template ?? null;

  return (
    <Dialog open={template !== null} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent
        className="max-h-[min(90dvh,42rem)] overflow-y-auto sm:max-w-lg"
        closeAriaLabel={SPECIALTY_REVIEW_TEMPLATES_PREVIEW_CLOSE_LABEL}
        data-testid="specialty-template-preview-dialog"
      >
        {template !== null ? (
          <>
            <DialogHeader>
              <DialogTitle>{template.title} preview</DialogTitle>
              <DialogDescription>{template.purpose}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <PreviewTemplateSummary template={template} />
              <PreviewSection title="Sample review questions" items={template.preview.exampleQuestions} />
              <PreviewSection title="Evidence typically requested" items={template.preview.evidenceTypicallyRequested} />
              <section aria-label="Policy areas involved">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Policy areas involved</h3>
                <PreviewPolicyPackLinks packs={template.preview.policyAreas} />
              </section>
              <PreviewSection title="Likely outputs" items={template.preview.likelyOutputs} />
              <PreviewSection title="Optional integrations" items={template.preview.optionalIntegrations} />
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <p className={cn("m-0 w-full text-left sm:max-w-[55%]", OPERATOR_TYPOGRAPHY.micro, "text-al-text-secondary")}>
                {SPECIALTY_REVIEW_TEMPLATES_PREVIEW_DISCLAIMER}
              </p>
              <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                <DialogClose asChild>
                  <Button type="button" size="sm" variant="outline" data-testid="specialty-template-preview-close">
                    {SPECIALTY_REVIEW_TEMPLATES_PREVIEW_CLOSE_LABEL}
                  </Button>
                </DialogClose>
                <Button asChild size="sm" variant="primary" data-testid="specialty-template-preview-sample-review">
                  <Link href={template.sampleReviewHref}>{SPECIALTY_REVIEW_TEMPLATES_SAMPLE_REVIEW_LABEL}</Link>
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
