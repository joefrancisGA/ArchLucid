"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SpecialtyReviewPolicyPackReference, SpecialtyReviewTemplateDefinition } from "@/lib/specialty-review-templates";

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

export type SpecialtyTemplatePreviewDialogProps = {
  readonly preview: SpecialtyTemplatePreviewState | null;
  readonly onClose: () => void;
};

export function SpecialtyTemplatePreviewDialog(props: SpecialtyTemplatePreviewDialogProps): React.ReactElement {
  const template = props.preview?.template ?? null;

  return (
    <Dialog open={template !== null} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="max-h-[min(90dvh,42rem)] overflow-y-auto sm:max-w-lg" data-testid="specialty-template-preview-dialog">
        {template !== null ? (
          <>
            <DialogHeader>
              <DialogTitle>{template.title} preview</DialogTitle>
              <DialogDescription>{template.purpose}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <PreviewSection title="Sample review questions" items={template.preview.exampleQuestions} />
              <PreviewSection title="Evidence typically requested" items={template.preview.evidenceTypicallyRequested} />
              <section aria-label="Policy areas involved">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Policy areas involved</h3>
                <PreviewPolicyPackLinks packs={template.preview.policyAreas} />
              </section>
              <PreviewSection title="Likely outputs" items={template.preview.likelyOutputs} />
              <PreviewSection title="Optional integrations" items={template.preview.optionalIntegrations} />
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                <Link href={template.sampleReviewHref} className={cn(OPERATOR_LINK.inline)}>
                  Open sample review
                </Link>
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
