"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { SecureNowCollectionSetupStatusSection } from "@/components/product-line/SecureNowCollectionSetupStatusSection";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";
import { cn } from "@/lib/utils";

/** SecureNow collection 3/3 posture on home before the first committed review package. */
export function OperatorHomeSecureNowCollectionSetupSection(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const { collectionInput, isPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
  });

  if (productLine !== "security") {
    return null;
  }

  if (isPending || collectionInput === null) {
    return (
      <section
        className="space-y-2"
        data-testid="operator-home-securenow-collection-setup"
        aria-labelledby="operator-home-collection-setup-heading"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="operator-home-collection-setup-loading">
          Loading collection setup…
        </p>
      </section>
    );
  }

  if (isSecureNowCollectionSetupComplete(collectionInput)) {
    return null;
  }

  return (
    <section
      className="space-y-2"
      data-testid="operator-home-securenow-collection-setup"
      aria-labelledby="operator-home-collection-setup-heading"
    >
      <SecureNowCollectionSetupStatusSection testIdPrefix="operator-home" sectionId="operator-home-collection-setup" />
    </section>
  );
}
