"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_PRODUCT_LINE_PATH } from "@/lib/product-line/product-line-catalog";
import { PRODUCT_LINE_LABELS } from "@/lib/product-line/product-line-copy";
import { PRODUCT_LINE_IDS } from "@/lib/product-line/product-line-id";

export function ProductLineSwitchBar(): React.JSX.Element {
  const { productLine, setProductLine } = useProductLine();

  return (
    <div className="flex flex-col gap-2" data-testid="product-line-switch-bar">
      <p className={OPERATOR_TYPOGRAPHY.helper}>Product shell</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Product shell">
        {PRODUCT_LINE_IDS.map((id) => {
          const selected = productLine === id;

          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              aria-pressed={selected}
              data-testid={`product-line-option-${id}`}
              onClick={() => {
                setProductLine(id);
              }}
            >
              {PRODUCT_LINE_LABELS[id]}
            </Button>
          );
        })}
      </div>
      <Link href={INTERNAL_PRODUCT_LINE_PATH} className={OPERATOR_LINK.inline}>
        Move individual destinations
      </Link>
    </div>
  );
}
