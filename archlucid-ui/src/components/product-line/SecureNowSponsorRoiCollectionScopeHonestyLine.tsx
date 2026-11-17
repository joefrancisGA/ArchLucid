"use client";

import Link from "next/link";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";
import { SECURENOW_SPONSOR_ROI_COLLECTION_SCOPE_HONESTY_LINE } from "@/lib/product-line/securenow-sponsor-roi-collection-honesty";
import { cn } from "@/lib/utils";

export type SecureNowSponsorRoiCollectionScopeHonestyLineProps = {
  readonly testId?: string;
  readonly className?: string;
};

/** SecureNow-only ROI honesty when collection setup is incomplete. */
export function SecureNowSponsorRoiCollectionScopeHonestyLine(
  props: SecureNowSponsorRoiCollectionScopeHonestyLineProps,
): React.JSX.Element | null {
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
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, props.className)}
      data-testid={props.testId ?? "securenow-sponsor-roi-collection-scope-honesty"}
    >
      {SECURENOW_SPONSOR_ROI_COLLECTION_SCOPE_HONESTY_LINE}{" "}
      <Link href={CLOUD_CONNECTIONS_PATH} className={OPERATOR_LINK.inline}>
        Cloud connections
      </Link>
    </p>
  );
}
