"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  formatSecureNowCollectionSetupProgressSummary,
  isSecureNowCollectionSetupComplete,
} from "@/lib/product-line/format-securenow-collection-setup-progress";
import { cn } from "@/lib/utils";

/** Path inspect is ranked-path output — collection must be ready before buyers treat paths as current scope. */
export function SecureNowRemediationFactoryCollectionSetupBanner(): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const { collectionInput, isPending } = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: null,
  });

  if (productLine !== "security" || isPending || collectionInput === null) {
    return null;
  }

  if (isSecureNowCollectionSetupComplete(collectionInput)) {
    return null;
  }

  return (
    <section
      className="rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900 dark:bg-amber-950/30"
      data-testid="remediation-factory-collection-setup-banner"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {formatSecureNowCollectionSetupProgressSummary(collectionInput)}
      </p>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
        Finish collection setup before relying on ranked paths for scope.{" "}
        <Link
          href={CLOUD_CONNECTIONS_PATH}
          className={OPERATOR_LINK.inline}
          data-testid="remediation-factory-collection-setup-cloud-connections-link"
        >
          Cloud connections
        </Link>
      </p>
    </section>
  );
}
