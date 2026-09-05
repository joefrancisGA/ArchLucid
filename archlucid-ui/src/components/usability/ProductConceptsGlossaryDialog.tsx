"use client";

import { BookText } from "lucide-react";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

type ProductConceptsGlossaryDialogProps = {
  readonly open?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  /** When false, only the dialog surface is rendered (parent supplies open state). */
  readonly showTrigger?: boolean;
};

/** Shell glossary entry — defines core product concepts on demand without surfacing them on every screen. */
export function ProductConceptsGlossaryDialog(props: ProductConceptsGlossaryDialogProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const productConceptsGlossaryOpenParam = searchParams.get("productConceptsGlossaryOpen");
  const isControlled = props.open !== undefined;
  const [internalOpen, setInternalOpenState] = useState(() =>
    parseProductConceptsGlossaryOpenFromSearch(productConceptsGlossaryOpenParam),
  );
  const open = isControlled ? props.open : internalOpen;
  const showTrigger = props.showTrigger !== false;

  const syncOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      if (isControlled) {
        return;
      }

      router.replace(productConceptsGlossaryHrefFromSearch(searchParams.toString(), nextOpen, pathname), {
        scroll: false,
      });
    },
    [isControlled, pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      if (isControlled) {
        const next = typeof value === "function" ? value(props.open === true) : value;
        props.onOpenChange?.(next);

        return;
      }

      setInternalOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncOpenToUrl(next);

        return next;
      });
    },
    [isControlled, props, syncOpenToUrl],
  );

  useEffect(() => {
    if (isControlled) {
      return;
    }

    setInternalOpenState(parseProductConceptsGlossaryOpenFromSearch(productConceptsGlossaryOpenParam));
  }, [isControlled, productConceptsGlossaryOpenParam]);

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
