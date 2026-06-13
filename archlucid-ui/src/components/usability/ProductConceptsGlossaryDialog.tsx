"use client";

import { BookText } from "lucide-react";
import { useState } from "react";

import { ProductConceptsGlossary } from "@/components/ProductConceptsGlossary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION, PRODUCT_CONCEPTS_GLOSSARY_DIALOG_TITLE } from "@/lib/buyer-polish-copy";

/** Shell glossary entry — defines core product concepts on demand without surfacing them on every screen. */
export function ProductConceptsGlossaryDialog(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-neutral-700 dark:text-neutral-300"
        data-testid="product-concepts-glossary-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
        }}
      >
        <BookText className="h-4 w-4" aria-hidden />
        <span className="text-xs font-medium">Concepts</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" data-testid="product-concepts-glossary-dialog">
          <DialogHeader>
            <DialogTitle>{PRODUCT_CONCEPTS_GLOSSARY_DIALOG_TITLE}</DialogTitle>
            <DialogDescription>{PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <ProductConceptsGlossary defaultOpen />
        </DialogContent>
      </Dialog>
    </>
  );
}
