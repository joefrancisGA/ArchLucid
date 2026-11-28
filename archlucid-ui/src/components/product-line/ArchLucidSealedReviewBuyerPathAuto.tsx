"use client";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { ArchLucidSealedReviewBuyerPathStrip } from "@/components/product-line/ArchLucidSealedReviewBuyerPathStrip";
import { resolveArchLucidSealedReviewBuyerPath } from "@/lib/product-line/resolve-archlucid-sealed-review-buyer-path";

export type ArchLucidSealedReviewBuyerPathAutoProps = { readonly testId: string; readonly enabled?: boolean };

export function ArchLucidSealedReviewBuyerPathAuto(props: ArchLucidSealedReviewBuyerPathAutoProps): React.JSX.Element | null {
  const { productLine } = useProductLine();
  if (props.enabled === false || productLine !== "architecture") return null;
  return <ArchLucidSealedReviewBuyerPathStrip testId={props.testId} buyerPath={resolveArchLucidSealedReviewBuyerPath()} />;
}
