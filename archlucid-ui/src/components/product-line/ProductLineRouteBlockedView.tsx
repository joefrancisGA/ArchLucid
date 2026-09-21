"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_PRODUCT_LINE_PATH } from "@/lib/product-line/product-line-catalog";
import {
  PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL,
  PRODUCT_LINE_PLAYGROUND_TITLE,
} from "@/lib/product-line/product-line-copy";
import { PRODUCT_LINE_ROUTE_GATE_HOME_PATH } from "@/lib/product-line/product-line-route-gate";
import { resolveProductLineRouteBlockedPresentation } from "@/lib/product-line/product-line-route-blocked";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ProductLineRouteBlockedViewProps = {
  readonly pathname: string;
};

/** Announced cross-product block — preserves destination and reason (SRE / securenow-ui-rate). */
export function ProductLineRouteBlockedView(props: ProductLineRouteBlockedViewProps): React.JSX.Element {
  const { productLine, assignmentOverrides, setProductLine } = useProductLine();
  const presentation = resolveProductLineRouteBlockedPresentation({
    pathname: props.pathname,
    activeProductLine: productLine,
    assignmentOverrides,
  });

  return (
    <section
      className="mx-auto max-w-2xl space-y-4 p-4"
      data-testid="product-line-route-gate-blocked"
      role="alert"
      aria-live="assertive"
      aria-labelledby="product-line-route-gate-blocked-title"
    >
      <header className="space-y-2">
        <StatusTag kind="needs-attention" label="Product shell mismatch" />
        <h1
          id="product-line-route-gate-blocked-title"
          className={OPERATOR_TYPOGRAPHY.pageTitle}
          data-testid="product-line-route-gate-blocked-destination"
        >
          {presentation.blockedPath}
        </h1>
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="product-line-route-gate-blocked-reason">
          {presentation.reasonSentence} You are signed in to the {presentation.activeProductLabel} shell.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {presentation.switchToProductLine !== null ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            data-testid="product-line-route-gate-switch-product-line"
            onClick={() => {
              setProductLine(presentation.switchToProductLine as ProductLineId);
            }}
          >
            Switch to {presentation.switchToProductLabel}
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={PRODUCT_LINE_ROUTE_GATE_HOME_PATH} data-testid="product-line-route-gate-go-home">
            Go to home
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={INTERNAL_PRODUCT_LINE_PATH} data-testid="product-line-route-gate-open-playground">
            {PRODUCT_LINE_OPEN_INTERNAL_LINK_LABEL}
          </Link>
        </Button>
      </div>

      <p className={OPERATOR_TYPOGRAPHY.helper}>
        <span className="font-medium">{PRODUCT_LINE_PLAYGROUND_TITLE}:</span>{" "}
        assign destinations per shell or run dual local ports (Architecture :3000, SecureNow :3001).{" "}
        <Link href={INTERNAL_PRODUCT_LINE_PATH} className={OPERATOR_LINK.inline}>
          Open product line
        </Link>
      </p>
    </section>
  );
}
