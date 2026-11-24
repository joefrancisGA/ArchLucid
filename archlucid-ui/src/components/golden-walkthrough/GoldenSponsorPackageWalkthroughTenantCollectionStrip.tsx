"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TENANT_COLLECTION_LINE } from "@/lib/golden-sponsor-package-walkthrough-tenant-collection-copy";
import {
  buildSecureNowSecondCaptureCloudConnectionsHref,
  buildSecureNowSecondCaptureExtractUploadHref,
} from "@/lib/product-line/securenow-second-capture-cloud-connections-return-path";
import {
  SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL,
  SECURENOW_SECOND_CAPTURE_EXTRACT_UPLOAD_LABEL,
} from "@/lib/product-line/securenow-second-capture-cta-copy";
import { cn } from "@/lib/utils";

/** Tenant collection recovery after the illustrative golden sponsor walkthrough panel. */
export function GoldenSponsorPackageWalkthroughTenantCollectionStrip(): React.JSX.Element {
  const pathname = usePathname() ?? "/";

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="golden-sponsor-package-walkthrough-tenant-collection"
    >
      {GOLDEN_SPONSOR_PACKAGE_WALKTHROUGH_TENANT_COLLECTION_LINE}{" "}
      <Link
        className={OPERATOR_LINK.inline}
        href={buildSecureNowSecondCaptureCloudConnectionsHref(pathname)}
        data-testid="golden-sponsor-package-walkthrough-tenant-cloud-connections"
      >
        {SECURENOW_SECOND_CAPTURE_CLOUD_CONNECTIONS_LABEL}
      </Link>
      {" · "}
      <Link
        className={OPERATOR_LINK.inline}
        href={buildSecureNowSecondCaptureExtractUploadHref(pathname)}
        data-testid="golden-sponsor-package-walkthrough-tenant-extract-upload"
      >
        {SECURENOW_SECOND_CAPTURE_EXTRACT_UPLOAD_LABEL}
      </Link>
    </p>
  );
}
