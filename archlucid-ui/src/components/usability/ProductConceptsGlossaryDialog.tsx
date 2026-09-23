"use client";

import { BookText } from "lucide-react";
import { useCallback, type SetStateAction } from "react";

import { ProductConceptsGlossary } from "@/components/ProductConceptsGlossary";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION, PRODUCT_CONCEPTS_GLOSSARY_DIALOG_TITLE } from "@/lib/buyer/buyer-polish-copy";
import {
  parseProductConceptsGlossaryOpenFromSearch,
  productConceptsGlossaryHrefFromSearch,
} from "@/lib/operator/product-concepts-glossary-url";
import { useBooleanSearchParamUrlSync } from "@/hooks/use-boolean-search-param-url-sync";

type ProductConceptsGlossaryDialogProps = {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** When false, only the dialog surface is rendered (parent supplies open state). */
  readonly showTrigger?: boolean;
};

/** Shell glossary entry — defines core product concepts on demand without surfacing them on every screen. */
export function ProductConceptsGlossaryDialog(props: ProductConceptsGlossaryDialogProps): React.JSX.Element {
  const isControlled = props.open !== undefined;
  const [internalOpen, setInternalOpen] = useBooleanSearchParamUrlSync(
    "productConceptsGlossaryOpen",
    parseProductConceptsGlossaryOpenFromSearch,
    productConceptsGlossaryHrefFromSearch,
  );
  const open = isControlled ? props.open === true : internalOpen;
  const showTrigger = props.showTrigger !== false;

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = isControlled ? props.open === true : internalOpen;
      const next = typeof value === "function" ? value(current) : value;

      if (isControlled) {
        props.onOpenChange?.(next);

        return;
      }

      setInternalOpen(next);
    },
    [internalOpen, isControlled, props, setInternalOpen],
  );

  return (
    <>
      {showTrigger ? (
        <Button
          type="button"
          variant="outline"
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
          Concepts
        </Button>
      ) : null}
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
